import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type AuthContext,
  type TokenTopUpBody,
} from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { AdaptyService } from './adapty.service.js';
import { TopUpProvider, type TopUpPaymentOutcome } from './top-up.provider.js';
import { TokenPackagesService } from './token-packages.service.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly topUpProvider: TopUpProvider,
    private readonly packages: TokenPackagesService,
    private readonly adapty: AdaptyService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async resolveTopUpAmount(
    employerId: string,
    body: TokenTopUpBody,
  ): Promise<{
    total: number;
    base: number;
    bonus: number;
    packageId: string | null;
  }> {
    let base = body.amount ?? 0;
    let packageId: string | null = null;
    if (body.packageId) {
      const pkg = await this.packages.getActiveById(body.packageId);
      base = pkg.tokenCount;
      packageId = pkg.id;
    }
    if (base <= 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Jeton tutarı geçersiz.',
      );
    }
    const plan = await this.subscriptions.planForEmployer(employerId);
    const bonus = packageId ? plan.tokenBonusOnPurchase : 0;
    return { total: base + bonus, base, bonus, packageId };
  }

  async ensureAccount(employerId: string, startingBalance: number) {
    await this.prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: startingBalance },
      update: {},
    });
  }

  private async resolveSpendPool(
    tx: Tx,
    employerId: string,
    branchId: string | null | undefined,
    amount: number,
    ownerUserId?: string,
  ): Promise<{ balance: number; branchId: string | null }> {
    let useBranchId: string | null = null;
    if (branchId) {
      const branchAcc = await tx.tokenAccount.findUnique({
        where: { branchId },
      });
      if (branchAcc) {
        useBranchId = branchId;
      }
    }
    if (!useBranchId) {
      await tx.tokenAccount.upsert({
        where: { employerId },
        create: { employerId, balance: 0 },
        update: {},
      });
    }
    const account = useBranchId
      ? await tx.tokenAccount.findUnique({ where: { branchId: useBranchId } })
      : await tx.tokenAccount.findUnique({ where: { employerId } });
    if (!account) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.TOKEN_INSUFFICIENT,
        'Jeton hesabı bulunamadı.',
      );
    }
    const heldAgg = await tx.tokenHold.aggregate({
      where: useBranchId
        ? { branchId: useBranchId, status: 'held' }
        : { employerId, branchId: null, status: 'held' },
      _sum: { amount: true },
    });
    let available = account.balance - (heldAgg._sum.amount ?? 0);
    let purseUserId = ownerUserId;
    if (!purseUserId) {
      const owner = await tx.employerMembership.findFirst({
        where: { employerId, role: 'owner', status: 'active' },
      });
      purseUserId = owner?.userId;
    }
    if (available < amount && purseUserId) {
      const need = amount - available;
      await this.transferFromPurse(
        tx,
        purseUserId,
        employerId,
        useBranchId,
        need,
      );
      const refreshed = useBranchId
        ? await tx.tokenAccount.findUnique({
            where: { branchId: useBranchId },
          })
        : await tx.tokenAccount.findUnique({ where: { employerId } });
      const heldAgain = await tx.tokenHold.aggregate({
        where: useBranchId
          ? { branchId: useBranchId, status: 'held' }
          : { employerId, branchId: null, status: 'held' },
        _sum: { amount: true },
      });
      available = (refreshed?.balance ?? 0) - (heldAgain._sum.amount ?? 0);
    }
    if (available < amount) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.TOKEN_INSUFFICIENT,
        'Yetersiz jeton bakiyesi.',
      );
    }
    const latest = useBranchId
      ? await tx.tokenAccount.findUnique({ where: { branchId: useBranchId } })
      : await tx.tokenAccount.findUnique({ where: { employerId } });
    return { balance: latest?.balance ?? account.balance, branchId: useBranchId };
  }

  private async transferFromPurse(
    tx: Tx,
    ownerUserId: string,
    employerId: string,
    branchId: string | null,
    amount: number,
    required = false,
  ) {
    await tx.tokenAccount.upsert({
      where: { ownerUserId },
      create: { ownerUserId, balance: 0 },
      update: {},
    });
    const purse = await tx.tokenAccount.findUnique({
      where: { ownerUserId },
    });
    if (required && (purse?.balance ?? 0) < amount) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.TOKEN_INSUFFICIENT,
        'Yetersiz jeton bakiyesi.',
      );
    }
    const move = Math.min(amount, purse?.balance ?? 0);
    if (move <= 0) {
      return;
    }
    await tx.tokenAccount.update({
      where: { ownerUserId },
      data: { balance: { decrement: move } },
    });
    if (branchId) {
      await tx.tokenAccount.upsert({
        where: { branchId },
        create: { branchId, balance: move },
        update: { balance: { increment: move } },
      });
    } else {
      await tx.tokenAccount.upsert({
        where: { employerId },
        create: { employerId, balance: move },
        update: { balance: { increment: move } },
      });
    }
    const dest = branchId
      ? await tx.tokenAccount.findUnique({ where: { branchId } })
      : await tx.tokenAccount.findUnique({ where: { employerId } });
    const purseAfter = await tx.tokenAccount.findUnique({
      where: { ownerUserId },
    });
    await tx.tokenLedgerEntry.create({
      data: {
        ownerUserId,
        employerId,
        branchId,
        type: 'transfer',
        amount: -move,
        balanceAfter: purseAfter?.balance ?? 0,
        refType: 'allocate',
      },
    });
    await tx.tokenLedgerEntry.create({
      data: {
        employerId,
        branchId,
        type: 'transfer',
        amount: move,
        balanceAfter: dest?.balance ?? 0,
        refType: 'allocate',
      },
    });
  }

  listTopUpPackages() {
    return this.packages.listActivePublic();
  }

  async ensurePurse(userId: string) {
    await this.prisma.tokenAccount.upsert({
      where: { ownerUserId: userId },
      create: { ownerUserId: userId, balance: 0 },
      update: {},
    });
  }

  private async heldOnWorkplace(employerId: string, branchId?: string | null) {
    const held = await this.prisma.tokenHold.aggregate({
      where: branchId
        ? { branchId, status: 'held' }
        : { employerId, branchId: null, status: 'held' },
      _sum: { amount: true },
    });
    return held._sum.amount ?? 0;
  }

  async getBalance(employerId: string, ctx?: AuthContext & { userId?: string }) {
    await this.ensureAccount(
      employerId,
      this.config.env.TOKEN_STARTING_BALANCE,
    );
    const workplace = await this.prisma.tokenAccount.findUnique({
      where: { employerId },
    });
    const workplaceHeld = await this.heldOnWorkplace(employerId);
    const workplaceBalance = workplace?.balance ?? 0;
    const workplaceAvailable = Math.max(0, workplaceBalance - workplaceHeld);

    const branches = await this.prisma.branch.findMany({
      where: { employerId, status: 'active' },
      include: { tokenAccount: true },
      orderBy: { createdAt: 'asc' },
    });
    const branchPools = [];
    for (const branch of branches) {
      if (ctx?.role === 'manager' && ctx.branchIds?.length) {
        if (!ctx.branchIds.includes(branch.id)) {
          continue;
        }
      }
      const held = await this.heldOnWorkplace(employerId, branch.id);
      const balance = branch.tokenAccount?.balance ?? 0;
      branchPools.push({
        branchId: branch.id,
        name: branch.name,
        balance,
        held,
        available: Math.max(0, balance - held),
      });
    }

    let unallocated = 0;
    if (ctx?.role === 'employer' && ctx.userId) {
      await this.ensurePurse(ctx.userId);
      const purse = await this.prisma.tokenAccount.findUnique({
        where: { ownerUserId: ctx.userId },
      });
      unallocated = purse?.balance ?? 0;
    }

    const managerLocked =
      ctx?.role === 'manager' && (ctx.branchIds?.length ?? 0) > 0;
    const spendable = managerLocked
      ? branchPools.reduce((sum, row) => sum + row.available, 0)
      : unallocated + workplaceAvailable;

    const heldTotal = managerLocked
      ? branchPools.reduce((sum, row) => sum + row.held, 0)
      : workplaceHeld + branchPools.reduce((sum, row) => sum + row.held, 0);

    return {
      balance: managerLocked
        ? branchPools.reduce((sum, row) => sum + row.balance, 0)
        : unallocated + workplaceBalance,
      held: heldTotal,
      available: spendable,
      unallocated,
      workplace: workplaceBalance,
      branches: branchPools,
    };
  }

  async listLedger(
    employerId: string,
    ctx?: AuthContext & { userId?: string },
    limit = 50,
  ) {
    const branchIds = (
      await this.prisma.branch.findMany({
        where: { employerId },
        select: { id: true },
      })
    ).map((row) => row.id);
    const or: Prisma.TokenLedgerEntryWhereInput[] = [{ employerId }];
    if (ctx?.role === 'employer' && ctx.userId) {
      or.push({ ownerUserId: ctx.userId });
    }
    if (branchIds.length > 0) {
      or.push({ branchId: { in: branchIds } });
    }
    const items = await this.prisma.tokenLedgerEntry.findMany({
      where: { OR: or },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      items: items.map((row) => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        balanceAfter: row.balanceAfter,
        refType: row.refType,
        refId: row.refId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async holdForJob(
    employerId: string,
    jobId: string,
    amount: number,
    idempotencyKey?: string,
    opts?: {
      branchId?: string | null;
      actorRole?: string;
      actorUserId?: string;
    },
  ) {
    if (amount <= 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Jeton tutarı geçersiz.',
      );
    }
    if (idempotencyKey) {
      const prior = await this.prisma.tokenLedgerEntry.findUnique({
        where: { idempotencyKey },
      });
      if (prior) {
        if (prior.type !== 'hold') {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Idempotency-Key bu işlem için kullanılmış.',
          );
        }
        if (prior.refId && prior.refId !== jobId) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.HOLD_EXISTS,
            'Bu Idempotency-Key başka bir provizyon için kayıtlı.',
          );
        }
        if (prior.amount !== -amount) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Idempotency-Key ile istek gövdesi uyuşmuyor.',
          );
        }
        const hold = await this.prisma.tokenHold.findUnique({
          where: { jobId },
        });
        if (hold) {
          return hold;
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tokenHold.findUnique({ where: { jobId } });
      if (existing?.status === 'held') {
        return existing;
      }

      const pool = await this.resolveSpendPool(
        tx,
        employerId,
        opts?.branchId,
        amount,
        opts?.actorRole !== 'manager' ? opts?.actorUserId : undefined,
      );

      const hold = await tx.tokenHold.create({
        data: {
          employerId,
          branchId: pool.branchId,
          jobId,
          amount,
          status: 'held',
        },
      });

      await tx.tokenLedgerEntry.create({
        data: {
          employerId,
          branchId: pool.branchId,
          type: 'hold',
          amount: -amount,
          balanceAfter: pool.balance,
          refType: 'job',
          refId: jobId,
          idempotencyKey,
        },
      });

      return hold;
    });
  }

  async adjustHoldForJob(
    employerId: string,
    jobId: string,
    _previousHeadcount: number,
    newHeadcount: number,
    idempotencyKey?: string,
    opts?: { refund?: boolean },
  ) {
    const refund = opts?.refund !== false;
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.tokenHold.findUnique({ where: { jobId } });
      if (!hold || hold.status !== 'held') {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          'Aktif jeton provizyonu bulunamadı.',
        );
      }

      if (newHeadcount > hold.amount) {
        const delta = newHeadcount - hold.amount;
        const account = await tx.tokenAccount.findUnique({
          where: { employerId },
        });
        if (!account) {
          throw new ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.TOKEN_INSUFFICIENT,
            'Jeton hesabı bulunamadı.',
          );
        }
        const heldAgg = await tx.tokenHold.aggregate({
          where: { employerId, status: 'held' },
          _sum: { amount: true },
        });
        const heldTotal = heldAgg._sum.amount ?? 0;
        const available = account.balance - heldTotal;
        if (available < delta) {
          throw new ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.TOKEN_INSUFFICIENT,
            'Yetersiz jeton bakiyesi.',
          );
        }
        await tx.tokenHold.update({
          where: { id: hold.id },
          data: { amount: hold.amount + delta },
        });
        await tx.tokenLedgerEntry.create({
          data: {
            employerId,
            type: 'hold',
            amount: -delta,
            balanceAfter: account.balance,
            refType: 'job',
            refId: jobId,
            idempotencyKey,
          },
        });
        return;
      }

      if (!refund || newHeadcount >= hold.amount) {
        return;
      }
      const release = hold.amount - newHeadcount;
      if (release <= 0) {
        return;
      }
      const newAmount = hold.amount - release;
      await tx.tokenHold.update({
        where: { id: hold.id },
        data: {
          amount: newAmount,
          status: newAmount <= 0 ? 'captured' : 'held',
        },
      });
      const account = await tx.tokenAccount.findUnique({
        where: { employerId },
      });
      await tx.tokenLedgerEntry.create({
        data: {
          employerId: hold.employerId,
          type: 'release',
          amount: release,
          balanceAfter: account?.balance ?? 0,
          refType: 'job',
          refId: jobId,
          idempotencyKey:
            idempotencyKey ?? `release:adjust:${jobId}:${newHeadcount}`,
        },
      });
    });
  }

  async releasePartialHold(
    jobId: string,
    seats: number,
    reason: string,
    idempotencyKey?: string,
  ) {
    if (seats <= 0) {
      return;
    }
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.tokenHold.findUnique({ where: { jobId } });
      if (!hold || hold.status !== 'held' || hold.amount <= 0) {
        return;
      }
      const release = Math.min(hold.amount, seats);
      const newAmount = hold.amount - release;
      await tx.tokenHold.update({
        where: { id: hold.id },
        data: {
          amount: newAmount,
          status: newAmount <= 0 ? 'released' : 'held',
        },
      });
      const account = await tx.tokenAccount.findUnique({
        where: { employerId: hold.employerId },
      });
      await tx.tokenLedgerEntry.create({
        data: {
          employerId: hold.employerId,
          type: 'release',
          amount: release,
          balanceAfter: account?.balance ?? 0,
          refType: 'job',
          refId: jobId,
          idempotencyKey:
            idempotencyKey ?? `release:partial:${jobId}:${reason}:${release}`,
        },
      });
    });
  }

  async releaseHold(jobId: string, reason: string, idempotencyKey?: string) {
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.tokenHold.findUnique({ where: { jobId } });
      if (!hold || hold.status !== 'held') {
        if (hold && hold.status === 'released') {
          return;
        }
        if (hold && hold.amount <= 0) {
          await tx.tokenHold.update({
            where: { id: hold.id },
            data: { status: 'released' },
          });
        }
        return;
      }
      await tx.tokenHold.update({
        where: { id: hold.id },
        data: { status: 'released' },
      });
      await tx.tokenLedgerEntry.create({
        data: {
          employerId: hold.employerId,
          type: 'release',
          amount: hold.amount,
          balanceAfter:
            (
              await tx.tokenAccount.findUnique({
                where: { employerId: hold.employerId },
              })
            )?.balance ?? 0,
          refType: 'job',
          refId: jobId,
          idempotencyKey: idempotencyKey ?? `release:${jobId}:${reason}`,
        },
      });
    });
  }

  async creditTopUp(
    employerId: string,
    amount: number,
    idempotencyKey?: string,
    paymentOutcome?: TopUpPaymentOutcome,
    meta?: {
      packageId: string | null;
      bonus: number;
      base: number;
      userId?: string;
      adaptyTransactionId?: string;
      source?: 'client' | 'webhook';
      creditTo?: 'workplace' | 'purse';
    },
  ) {
    await this.topUpProvider.assertPaymentAllowed({
      paymentOutcome,
      adaptyTransactionId: meta?.adaptyTransactionId,
    });
    if (meta?.adaptyTransactionId && (await this.adapty.isActive())) {
      if (meta.source !== 'webhook') {
        const pkg = meta.packageId
          ? await this.packages.getActiveById(meta.packageId)
          : null;
        await this.adapty.assertStorePurchase({
          customerUserId: meta.userId ?? employerId,
          transactionId: meta.adaptyTransactionId,
          vendorProductIds: pkg
            ? [pkg.iosProductId, pkg.androidProductId, pkg.adaptyProductId]
            : [],
        });
      }
      idempotencyKey = `adapty:${meta.adaptyTransactionId}`;
    }
    if (idempotencyKey) {
      const prior = await this.prisma.tokenLedgerEntry.findUnique({
        where: { idempotencyKey },
      });
      if (prior) {
        if (
          prior.employerId &&
          prior.employerId !== employerId &&
          !(meta?.userId && prior.ownerUserId === meta.userId)
        ) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Idempotency-Key başka bir işveren için kullanılmış.',
          );
        }
        if (prior.type !== 'top_up' || prior.amount !== amount) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Idempotency-Key ile istek gövdesi uyuşmuyor.',
          );
        }
        const account =
          meta?.creditTo === 'purse' && meta.userId
            ? await this.prisma.tokenAccount.findUnique({
                where: { ownerUserId: meta.userId },
              })
            : await this.prisma.tokenAccount.findUnique({
                where: { employerId },
              });
        return {
          balance: account?.balance ?? 0,
          credited: prior.amount,
          packageId: meta?.packageId ?? null,
          bonusCredited: meta?.bonus ?? 0,
        };
      }
    }

    const creditPurse = meta?.creditTo === 'purse' && Boolean(meta.userId);
    return this.prisma.$transaction(async (tx) => {
      if (creditPurse && meta?.userId) {
        await tx.tokenAccount.upsert({
          where: { ownerUserId: meta.userId },
          create: { ownerUserId: meta.userId, balance: amount },
          update: { balance: { increment: amount } },
        });
      } else {
        await tx.tokenAccount.upsert({
          where: { employerId },
          create: { employerId, balance: amount },
          update: { balance: { increment: amount } },
        });
      }
      const account = creditPurse && meta?.userId
        ? await tx.tokenAccount.findUnique({
            where: { ownerUserId: meta.userId },
          })
        : await tx.tokenAccount.findUnique({
            where: { employerId },
          });
      const balance = account?.balance ?? 0;
      await tx.tokenLedgerEntry.create({
        data: {
          employerId,
          ownerUserId: creditPurse ? meta?.userId : undefined,
          type: 'top_up',
          amount,
          balanceAfter: balance,
          refType: meta?.packageId ? 'token_package' : 'top_up',
          refId: meta?.packageId ?? undefined,
          idempotencyKey,
        },
      });
      return {
        balance,
        credited: amount,
        packageId: meta?.packageId ?? null,
        bonusCredited: meta?.bonus ?? 0,
      };
    });
  }

  async applyAdaptyWebhook(body: unknown): Promise<void> {
    if (!(await this.adapty.isActive())) {
      return;
    }
    if (!body || typeof body !== 'object') {
      return;
    }
    const event = body as Record<string, unknown>;
    const eventType = String(event.event_type ?? '');
    const customerUserId = String(event.customer_user_id ?? '');
    const props =
      event.event_properties && typeof event.event_properties === 'object'
        ? (event.event_properties as Record<string, unknown>)
        : {};
    const transactionId = String(
      props.transaction_id ?? props.original_transaction_id ?? '',
    );
    const vendorProductId = String(props.vendor_product_id ?? '');
    if (!customerUserId || !transactionId) {
      return;
    }
    const membership = await this.prisma.employerMembership.findFirst({
      where: { userId: customerUserId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      return;
    }
    if (eventType === 'non_subscription_purchase_refunded') {
      const refundKey = `adapty-refund:${transactionId}`;
      const already = await this.prisma.tokenLedgerEntry.findUnique({
        where: { idempotencyKey: refundKey },
      });
      if (already) {
        return;
      }
      const prior = await this.prisma.tokenLedgerEntry.findUnique({
        where: { idempotencyKey: `adapty:${transactionId}` },
      });
      if (!prior || prior.type !== 'top_up') {
        return;
      }
      await this.prisma.$transaction(async (tx) => {
        if (prior.ownerUserId) {
          await tx.tokenAccount.update({
            where: { ownerUserId: prior.ownerUserId },
            data: { balance: { decrement: prior.amount } },
          });
        } else {
          await tx.tokenAccount.update({
            where: { employerId: membership.employerId },
            data: { balance: { decrement: prior.amount } },
          });
        }
        const account = prior.ownerUserId
          ? await tx.tokenAccount.findUnique({
              where: { ownerUserId: prior.ownerUserId },
            })
          : await tx.tokenAccount.findUnique({
              where: { employerId: membership.employerId },
            });
        await tx.tokenLedgerEntry.create({
          data: {
            employerId: membership.employerId,
            ownerUserId: prior.ownerUserId,
            type: 'refund',
            amount: prior.amount,
            balanceAfter: account?.balance ?? 0,
            refType: 'adapty',
            idempotencyKey: refundKey,
          },
        });
      });
      return;
    }
    if (eventType !== 'non_subscription_purchase') {
      return;
    }
    const pkg = vendorProductId
      ? await this.prisma.tokenPackage.findFirst({
          where: {
            isActive: true,
            OR: [
              { iosProductId: vendorProductId },
              { androidProductId: vendorProductId },
              { adaptyProductId: vendorProductId },
            ],
          },
        })
      : null;
    if (!pkg) {
      return;
    }
    const resolved = await this.resolveTopUpAmount(membership.employerId, {
      packageId: pkg.id,
    });
    await this.creditTopUp(
      membership.employerId,
      resolved.total,
      `adapty:${transactionId}`,
      'approve',
      {
        packageId: resolved.packageId,
        bonus: resolved.bonus,
        base: resolved.base,
        userId: customerUserId,
        adaptyTransactionId: transactionId,
        source: 'webhook',
        creditTo: 'purse',
      },
    );
  }

  async allocate(
    userId: string,
    employerId: string,
    body: { amount: number; target: 'workplace' | 'branch'; branchId?: string },
  ) {
    if (body.target === 'branch' && !body.branchId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Şube jetonu için branchId gerekli.',
      );
    }
    if (body.target === 'branch' && body.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: body.branchId, employerId, status: 'active' },
      });
      if (!branch) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'Şube bulunamadı.',
        );
      }
    }
    await this.ensurePurse(userId);
    await this.ensureAccount(employerId, 0);
    return this.prisma.$transaction(async (tx) => {
      await this.transferFromPurse(
        tx,
        userId,
        employerId,
        body.target === 'branch' ? (body.branchId ?? null) : null,
        body.amount,
        true,
      );
      const purse = await tx.tokenAccount.findUnique({
        where: { ownerUserId: userId },
      });
      const workplace = await tx.tokenAccount.findUnique({
        where: { employerId },
      });
      const branchAcc =
        body.target === 'branch' && body.branchId
          ? await tx.tokenAccount.findUnique({
              where: { branchId: body.branchId },
            })
          : null;
      return {
        unallocated: purse?.balance ?? 0,
        workplace: workplace?.balance ?? 0,
        branchId: body.branchId ?? null,
        branchBalance: branchAcc?.balance ?? 0,
      };
    });
  }

  async createTokenRequest(
    userId: string,
    ctx: AuthContext,
    body: { amount?: number; branchId?: string; note?: string },
  ) {
    if (ctx.role !== 'manager' || !ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Jeton talebi yalnızca yönetici içindir.',
      );
    }
    let branchId = body.branchId ?? null;
    if (ctx.branchIds?.length) {
      if (branchId && !ctx.branchIds.includes(branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
      branchId = branchId ?? ctx.branchIds[0] ?? null;
    } else if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, employerId: ctx.employerId },
      });
      if (!branch) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'Şube bulunamadı.',
        );
      }
    }
    const pending = await this.prisma.tokenRequest.findFirst({
      where: {
        requesterUserId: userId,
        employerId: ctx.employerId,
        branchId,
        status: 'pending',
      },
    });
    if (pending) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bekleyen bir jeton talebiniz var.',
      );
    }
    const row = await this.prisma.tokenRequest.create({
      data: {
        requesterUserId: userId,
        employerId: ctx.employerId,
        branchId,
        amount: body.amount,
        note: body.note,
        status: 'pending',
      },
    });
    return this.mapTokenRequest(row);
  }

  async listTokenRequests(userId: string, ctx: AuthContext) {
    if (!ctx.employerId) {
      return { items: [] };
    }
    const where: Prisma.TokenRequestWhereInput = { employerId: ctx.employerId };
    if (ctx.role === 'manager') {
      where.requesterUserId = userId;
    }
    const items = await this.prisma.tokenRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((row) => this.mapTokenRequest(row)) };
  }

  async resolveTokenRequest(
    userId: string,
    ctx: AuthContext,
    requestId: string,
    action: 'approve' | 'reject',
    amount?: number,
  ) {
    if (ctx.role !== 'employer' || !ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Talebi yalnızca işveren sonuçlandırabilir.',
      );
    }
    const row = await this.prisma.tokenRequest.findFirst({
      where: { id: requestId, employerId: ctx.employerId },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Talep bulunamadı.',
      );
    }
    if (row.status !== 'pending') {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Talep zaten sonuçlandı.',
      );
    }
    if (action === 'reject') {
      const updated = await this.prisma.tokenRequest.update({
        where: { id: row.id },
        data: {
          status: 'rejected',
          resolvedByUserId: userId,
          resolvedAt: new Date(),
        },
      });
      return this.mapTokenRequest(updated);
    }
    const credit = amount ?? row.amount;
    if (credit == null || credit <= 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Onay için jeton miktarı gerekli.',
      );
    }
    await this.ensurePurse(userId);
    await this.prisma.$transaction(async (tx) => {
      await this.transferFromPurse(
        tx,
        userId,
        row.employerId,
        row.branchId,
        credit,
        true,
      );
      await tx.tokenRequest.update({
        where: { id: row.id },
        data: {
          status: 'approved',
          resolvedAmount: credit,
          resolvedByUserId: userId,
          resolvedAt: new Date(),
        },
      });
    });
    const updated = await this.prisma.tokenRequest.findUnique({
      where: { id: row.id },
    });
    return this.mapTokenRequest(updated!);
  }

  private mapTokenRequest(row: {
    id: string;
    requesterUserId: string;
    employerId: string;
    branchId: string | null;
    amount: number | null;
    status: string;
    note: string | null;
    resolvedAmount: number | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }) {
    return {
      id: row.id,
      requesterUserId: row.requesterUserId,
      employerId: row.employerId,
      branchId: row.branchId,
      amount: row.amount,
      status: row.status as 'pending' | 'approved' | 'rejected',
      note: row.note,
      resolvedAmount: row.resolvedAmount,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    };
  }

  async captureForShift(
    tx: Tx,
    shiftId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
      include: { job: true },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    const key =
      idempotencyKey ?? `capture:shift:${shiftId}`;
    const prior = await tx.tokenLedgerEntry.findUnique({
      where: { idempotencyKey: key },
    });
    if (prior) {
      return;
    }

    const hold = await tx.tokenHold.findUnique({
      where: { jobId: shift.jobId },
    });
    if (!hold || hold.status !== 'held' || hold.amount <= 0) {
      return;
    }

    const captureAmount = 1;
    const account = hold.branchId
      ? await tx.tokenAccount.findUnique({
          where: { branchId: hold.branchId },
        })
      : await tx.tokenAccount.findUnique({
          where: { employerId: shift.employerId },
        });
    if (!account) {
      return;
    }

    const newHoldAmount = hold.amount - captureAmount;
    await tx.tokenHold.update({
      where: { id: hold.id },
      data: {
        amount: newHoldAmount,
        status: newHoldAmount <= 0 ? 'captured' : 'held',
      },
    });

    await tx.tokenLedgerEntry.create({
      data: {
        employerId: shift.employerId,
        type: 'capture',
        amount: -captureAmount,
        balanceAfter: account.balance,
        refType: 'shift',
        refId: shiftId,
        idempotencyKey: key,
      },
    });
  }
}
