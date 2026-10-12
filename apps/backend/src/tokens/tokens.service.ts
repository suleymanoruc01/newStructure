import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode, type TokenTopUpBody } from '@parton/api-contracts';

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

  listTopUpPackages() {
    return this.packages.listActivePublic();
  }

  async getBalance(employerId: string) {
    await this.ensureAccount(
      employerId,
      this.config.env.TOKEN_STARTING_BALANCE,
    );
    const account = await this.prisma.tokenAccount.findUnique({
      where: { employerId },
    });
    const balance = account?.balance ?? 0;
    const held = await this.prisma.tokenHold.aggregate({
      where: { employerId, status: 'held' },
      _sum: { amount: true },
    });
    const heldAmount = held._sum.amount ?? 0;
    return {
      balance,
      held: heldAmount,
      available: balance - heldAmount,
    };
  }

  async listLedger(employerId: string, limit = 50) {
    const items = await this.prisma.tokenLedgerEntry.findMany({
      where: { employerId },
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
      const held = heldAgg._sum.amount ?? 0;
      const available = account.balance - held;
      if (available < amount) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.TOKEN_INSUFFICIENT,
          'Yetersiz jeton bakiyesi.',
        );
      }

      const hold = await tx.tokenHold.create({
        data: {
          employerId,
          jobId,
          amount,
          status: 'held',
        },
      });

      await tx.tokenLedgerEntry.create({
        data: {
          employerId,
          type: 'hold',
          amount: -amount,
          balanceAfter: account.balance,
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
    previousHeadcount: number,
    newHeadcount: number,
    idempotencyKey?: string,
  ) {
    const delta = newHeadcount - previousHeadcount;
    if (delta === 0) {
      return;
    }

    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.tokenHold.findUnique({ where: { jobId } });
      if (!hold || hold.status !== 'held') {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          'Aktif jeton provizyonu bulunamadı.',
        );
      }

      if (delta > 0) {
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

      const release = Math.min(hold.amount, -delta);
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
        if (prior.employerId !== employerId) {
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
        const account = await this.prisma.tokenAccount.findUnique({
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

    return this.prisma.$transaction(async (tx) => {
      await tx.tokenAccount.upsert({
        where: { employerId },
        create: { employerId, balance: amount },
        update: { balance: { increment: amount } },
      });
      const account = await tx.tokenAccount.findUnique({
        where: { employerId },
      });
      const balance = account?.balance ?? 0;
      await tx.tokenLedgerEntry.create({
        data: {
          employerId,
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
        await tx.tokenAccount.update({
          where: { employerId: membership.employerId },
          data: { balance: { decrement: prior.amount } },
        });
        const account = await tx.tokenAccount.findUnique({
          where: { employerId: membership.employerId },
        });
        await tx.tokenLedgerEntry.create({
          data: {
            employerId: membership.employerId,
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
      },
    );
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
    const account = await tx.tokenAccount.findUnique({
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
