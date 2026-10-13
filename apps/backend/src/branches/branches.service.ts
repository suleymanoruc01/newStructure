import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  branchManagerInviteDefaultPermissions,
  type AdminBranchCreateBody,
  type AdminBranchPatchBody,
  type AuthContext,
  type BranchCreateBody,
  type BranchPatchBody,
  type ManagerAssignmentPatchBody,
  type ManagerInvitePatchBody,
} from '@parton/api-contracts';
import { Prisma } from '../generated/prisma/client.js';

import {
  hashManagerJoinCode,
  hashRefreshToken,
  newRefreshToken,
  revealManagerJoinCode,
  sealManagerJoinCode,
  verifyManagerJoinCode,
} from '../auth/auth.crypto.js';
import {
  allocateUnusedManagerJoinCode,
  managerInviteExpiry,
} from '../auth/manager-invite.js';
import { MembershipService } from '../auth/membership.service.js';
import { SessionService } from '../auth/session.service.js';
import { TokenService } from '../auth/token.service.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { ApiException } from '../common/api.exception.js';
import {
  PUBLIC_CODE_PREFIX,
  allocatePublicCode,
} from '../common/public-code.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import { parseManagerPermissions } from '../auth/manager-permissions.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

function maskPhone(phone: string): string {
  if (phone.length < 8) {
    return phone;
  }
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly membership: MembershipService,
    private readonly config: AppConfigService,
    private readonly subscriptions: SubscriptionsService,
    private readonly audit: LegalAuditLogger,
  ) {}

  private mapBranch(branch: {
    id: string;
    employerId: string;
    publicCode: string;
    name: string;
    addressLine1: string | null;
    city: string | null;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
    status: string;
  }) {
    return {
      id: branch.id,
      employerId: branch.employerId,
      publicCode: branch.publicCode,
      name: branch.name,
      addressLine1: branch.addressLine1,
      city: branch.city,
      latitude: Number(branch.latitude),
      longitude: Number(branch.longitude),
      status: branch.status as 'active' | 'inactive' | 'archived',
    };
  }

  private async resolveEmployerId(
    userId: string,
    ctx: AuthContext,
  ): Promise<string> {
    if (!ctx.employerId) {
      throw new ApiException(
        ctx.role === 'employer'
          ? HttpStatus.UNPROCESSABLE_ENTITY
          : HttpStatus.FORBIDDEN,
        ctx.role === 'employer'
          ? ErrorCode.ONBOARDING_REQUIRED
          : ErrorCode.FORBIDDEN,
        ctx.role === 'employer'
          ? 'Önce işyeri oluşturun.'
          : 'Şube işlemi için işyeri bağlamı gerekli.',
      );
    }
    const workplace = await this.prisma.employer.findUnique({
      where: { id: ctx.employerId },
      select: { id: true },
    });
    if (!workplace) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşyeri bulunamadı.',
      );
    }
    if (ctx.role === 'employer') {
      const membership = await this.prisma.employerMembership.findFirst({
        where: {
          userId,
          employerId: ctx.employerId,
          status: 'active',
        },
      });
      if (!membership) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu işverene erişiminiz yok.',
        );
      }
      return ctx.employerId;
    }
    if (ctx.role === 'manager') {
      return ctx.employerId;
    }
    throw new ApiException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'Şube işlemi için işyeri bağlamı gerekli.',
    );
  }

  async listBranches(userId: string, ctx: AuthContext) {
    if (ctx.role === 'manager') {
      await this.membership.assertManagerLive(userId, ctx);
      if (ctx.branchIds?.length) {
        const live = await this.prisma.branchManager.findMany({
          where: {
            userId,
            status: 'active',
            branchId: { in: ctx.branchIds },
          },
          select: { branchId: true },
        });
        const branches = await this.prisma.branch.findMany({
          where: { id: { in: live.map((row) => row.branchId) } },
          orderBy: { createdAt: 'asc' },
        });
        return { items: branches.map((b) => this.mapBranch(b)) };
      }
    }
    const employerId = await this.resolveEmployerId(userId, ctx);
    const branches = await this.prisma.branch.findMany({
      where: { employerId },
      orderBy: { createdAt: 'asc' },
    });
    return { items: branches.map((b) => this.mapBranch(b)) };
  }

  async getBranch(userId: string, ctx: AuthContext, branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Şube bulunamadı.',
      );
    }
    if (ctx.role === 'manager') {
      await this.membership.assertManagerLive(userId, ctx, branchId);
      if (ctx.branchIds?.length && !ctx.branchIds.includes(branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şubeye erişiminiz yok.',
        );
      }
      if (ctx.branchIds?.length) {
        return this.mapBranch(branch);
      }
    }
    const employerId = await this.resolveEmployerId(userId, ctx);
    if (branch.employerId !== employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu şubeye erişiminiz yok.',
      );
    }
    const mapped = this.mapBranch(branch);
    if (ctx.role === 'employer') {
      const invite = await this.prisma.branchManagerInvite.findUnique({
        where: { branchId },
      });
      return {
        ...mapped,
        managerInviteCode: revealManagerJoinCode(
          invite?.joinCode,
          this.config.env.OTP_PEPPER,
        ),
      };
    }
    return mapped;
  }

  async createBranch(
    userId: string,
    ctx: AuthContext,
    body: BranchCreateBody,
  ) {
    await this.membership.assertPermission(userId, ctx, 'branches.create');
    assertValidCoordinates(body.latitude, body.longitude);
    const employerId = await this.resolveEmployerId(userId, ctx);
    await this.subscriptions.assertCanAddBranch(employerId);
    const { joinCode, codeHash } = await allocateUnusedManagerJoinCode(
      this.prisma,
      this.config.env.OTP_PEPPER,
    );
    const expiresAt = managerInviteExpiry();
    const branch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          employerId,
          publicCode: await allocatePublicCode(tx, PUBLIC_CODE_PREFIX.branch),
          name: body.name,
          addressLine1: body.addressLine1,
          city: body.city,
          latitude: new Prisma.Decimal(body.latitude),
          longitude: new Prisma.Decimal(body.longitude),
        },
      });
      await tx.branchManagerInvite.create({
        data: {
          branchId: created.id,
          joinCode: sealManagerJoinCode(joinCode, this.config.env.OTP_PEPPER),
          codeHash,
          expiresAt,
          invitedByUserId: userId,
          permissions: [...branchManagerInviteDefaultPermissions],
        },
      });
      return created;
    });
    return {
      ...this.mapBranch(branch),
      managerInviteCode: joinCode,
    };
  }

  async managerJoin(userId: string, sessionId: string, code: string) {
    const codeHash = hashManagerJoinCode(code, this.config.env.OTP_PEPPER);
    const workplaceInvite = await this.prisma.workplaceManagerInvite.findFirst({
      where: { codeHash, status: 'active' },
      include: { employer: true },
    });
    if (
      workplaceInvite &&
      verifyManagerJoinCode(
        code,
        this.config.env.OTP_PEPPER,
        workplaceInvite.codeHash,
      )
    ) {
      return this.completeWorkplaceManagerJoin(
        userId,
        sessionId,
        workplaceInvite,
      );
    }
    const invite = await this.prisma.branchManagerInvite.findFirst({
      where: { codeHash, status: 'active' },
      include: { branch: { include: { employer: true } } },
    });
    if (
      !invite ||
      !verifyManagerJoinCode(code, this.config.env.OTP_PEPPER, invite.codeHash)
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_MANAGER_CODE,
        'Geçersiz veya süresi dolmuş yönetici kodu.',
      );
    }
    return this.completeBranchManagerJoin(userId, sessionId, invite);
  }

  private async completeBranchManagerJoin(
    userId: string,
    sessionId: string,
    invite: {
      id: string;
      expiresAt: Date;
      maxUses: number;
      useCount: number;
      invitedByUserId: string;
      permissions: unknown;
      branch: {
        id: string;
        name: string;
        city: string | null;
        status: string;
        employerId: string;
        employer: { id: string; legalName: string; tradingName: string | null };
      };
    },
  ) {
    const branch = invite.branch;
    await this.assertCanJoinAsManager(userId, branch.employerId);
    if (branch.status !== 'active') {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.CONFLICT,
        'Şube aktif değil.',
      );
    }
    const existing = await this.prisma.branchManager.findUnique({
      where: { userId_branchId: { userId, branchId: branch.id } },
    });
    const isNew = existing?.status !== 'active';
    if (isNew) {
      this.assertInviteUsable(invite);
      await this.subscriptions.assertCanAddManager(
        branch.employerId,
        userId,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      if (isNew) {
        const consumed = await tx.branchManagerInvite.updateMany({
          where: {
            id: invite.id,
            status: 'active',
            useCount: { lt: invite.maxUses },
            expiresAt: { gt: new Date() },
          },
          data: { useCount: { increment: 1 } },
        });
        if (consumed.count !== 1) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Yönetici kodu kullanım limitine ulaştı.',
          );
        }
      }
      await tx.branchManager.upsert({
        where: {
          userId_branchId: { userId, branchId: branch.id },
        },
        create: {
          userId,
          branchId: branch.id,
          invitedByUserId: invite.invitedByUserId,
          status: 'active',
          permissions: parseManagerPermissions(invite.permissions),
        },
        update: isNew
          ? {
              status: 'active',
              permissions: parseManagerPermissions(invite.permissions),
            }
          : { status: 'active' },
      });
    });
    const session = await this.issueManagerSession(
      userId,
      sessionId,
      branch.employerId,
    );
    return {
      branch: {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        employerId: branch.employerId,
        employerName: branch.employer.legalName,
      },
      workplace: {
        id: branch.employerId,
        name: branch.employer.tradingName ?? branch.employer.legalName,
      },
      ...session,
    };
  }

  private async completeWorkplaceManagerJoin(
    userId: string,
    sessionId: string,
    invite: {
      id: string;
      employerId: string;
      expiresAt: Date;
      maxUses: number;
      useCount: number;
      invitedByUserId: string;
      permissions: unknown;
      employer: { id: string; legalName: string; tradingName: string | null };
    },
  ) {
    await this.assertCanJoinAsManager(userId, invite.employerId);
    const existing = await this.prisma.workplaceManager.findUnique({
      where: {
        userId_employerId: { userId, employerId: invite.employerId },
      },
    });
    const isNew = existing?.status !== 'active';
    if (isNew) {
      this.assertInviteUsable(invite);
      await this.subscriptions.assertCanAddManager(invite.employerId, userId);
    }
    await this.prisma.$transaction(async (tx) => {
      if (isNew) {
        const consumed = await tx.workplaceManagerInvite.updateMany({
          where: {
            id: invite.id,
            status: 'active',
            useCount: { lt: invite.maxUses },
            expiresAt: { gt: new Date() },
          },
          data: { useCount: { increment: 1 } },
        });
        if (consumed.count !== 1) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            'Yönetici kodu kullanım limitine ulaştı.',
          );
        }
      }
      await tx.workplaceManager.upsert({
        where: {
          userId_employerId: { userId, employerId: invite.employerId },
        },
        create: {
          userId,
          employerId: invite.employerId,
          invitedByUserId: invite.invitedByUserId,
          status: 'active',
          permissions: parseManagerPermissions(invite.permissions),
        },
        update: isNew
          ? {
              status: 'active',
              permissions: parseManagerPermissions(invite.permissions),
            }
          : { status: 'active' },
      });
    });
    const session = await this.issueManagerSession(
      userId,
      sessionId,
      invite.employerId,
    );
    return {
      workplace: {
        id: invite.employer.id,
        name: invite.employer.tradingName ?? invite.employer.legalName,
      },
      ...session,
    };
  }

  private assertInviteUsable(invite: {
    expiresAt: Date;
    maxUses: number;
    useCount: number;
  }) {
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_MANAGER_CODE,
        'Geçersiz veya süresi dolmuş yönetici kodu.',
      );
    }
    if (invite.useCount >= invite.maxUses) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Yönetici kodu kullanım limitine ulaştı.',
      );
    }
  }

  private async assertCanJoinAsManager(userId: string, employerId: string) {
    const membership = await this.prisma.employerMembership.findFirst({
      where: { userId, employerId, status: 'active' },
    });
    if (membership) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşyeri sahibi yönetici kodu kullanamaz.',
      );
    }
  }

  private async issueManagerSession(
    userId: string,
    sessionId: string,
    employerId: string,
  ) {
    const contexts = await this.membership.listContexts(userId);
    const active = contexts.find(
      (ctx) => ctx.role === 'manager' && ctx.employerId === employerId,
    );
    if (!active) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.ONBOARDING_REQUIRED,
        'Yönetici bağlamı kurulamadı.',
      );
    }
    await this.sessions.updateSessionContext(sessionId, active);
    const refreshToken = newRefreshToken();
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.config.env.OTP_PEPPER,
    );
    const expiresAt = new Date(
      Date.now() +
        this.config.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { tokenHash, expiresAt, activeContext: active },
    });
    const access = this.tokens.signAccess(userId, sessionId, active);
    const user = await this.membership.toMeUser(userId, active);
    return {
      accessToken: access.accessToken,
      accessExpiresAt: access.accessExpiresAt,
      refreshToken,
      user,
    };
  }

  async patchBranch(
    userId: string,
    ctx: AuthContext,
    branchId: string,
    body: BranchPatchBody,
  ) {
    if (body.status === 'archived' || body.status === 'inactive') {
      await this.membership.assertPermission(
        userId,
        ctx,
        'branches.delete',
        branchId,
      );
    } else {
      await this.membership.assertPermission(
        userId,
        ctx,
        'branches.update',
        branchId,
      );
    }
    await this.getBranch(userId, ctx, branchId);
    if (body.latitude !== undefined && body.longitude !== undefined) {
      assertValidCoordinates(body.latitude, body.longitude);
    }
    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: body.name,
        addressLine1: body.addressLine1,
        city: body.city,
        status: body.status,
        latitude:
          body.latitude !== undefined
            ? new Prisma.Decimal(body.latitude)
            : undefined,
        longitude:
          body.longitude !== undefined
            ? new Prisma.Decimal(body.longitude)
            : undefined,
      },
    });
    return this.mapBranch(updated);
  }

  async adminGetBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        employer: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            taxId: true,
            publicCode: true,
          },
        },
      },
    });
    if (!branch) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Şube bulunamadı.',
      );
    }
    const managers = await this.prisma.branchManager.findMany({
      where: { branchId },
      include: { user: { select: { phoneE164: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const invite = await this.prisma.branchManagerInvite.findUnique({
      where: { branchId },
    });
    return {
      ...this.mapBranch(branch),
      employer: branch.employer,
      managers: managers.map((row) => ({
        userId: row.userId,
        status: row.status,
        permissions: parseManagerPermissions(row.permissions),
        phoneE164: maskPhone(row.user.phoneE164),
        branchId,
        scope: 'branch' as const,
      })),
      invitePermissions: parseManagerPermissions(invite?.permissions),
      managerInviteCode: revealManagerJoinCode(
        invite?.joinCode,
        this.config.env.OTP_PEPPER,
      ),
    };
  }

  async listBranchManagers(userId: string, ctx: AuthContext, branchId: string) {
    await this.getBranch(userId, ctx, branchId);
    const managers = await this.prisma.branchManager.findMany({
      where: { branchId },
      include: { user: { select: { phoneE164: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const invite = await this.prisma.branchManagerInvite.findUnique({
      where: { branchId },
    });
    return {
      items: managers.map((row) => ({
        userId: row.userId,
        status: row.status,
        permissions: parseManagerPermissions(row.permissions),
        phoneE164: maskPhone(row.user.phoneE164),
        branchId,
        scope: 'branch' as const,
      })),
      inviteCode:
        ctx.role === 'employer'
          ? revealManagerJoinCode(
              invite?.joinCode,
              this.config.env.OTP_PEPPER,
            )
          : undefined,
      invitePermissions: parseManagerPermissions(invite?.permissions),
    };
  }

  async patchBranchManager(
    userId: string,
    ctx: AuthContext,
    branchId: string,
    managerUserId: string,
    body: ManagerAssignmentPatchBody,
  ) {
    if (ctx.role !== 'employer') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Yönetici yetkisini yalnızca işveren değiştirir.',
      );
    }
    await this.getBranch(userId, ctx, branchId);
    const row = await this.prisma.branchManager.findUnique({
      where: { userId_branchId: { userId: managerUserId, branchId } },
      include: { user: { select: { phoneE164: true } } },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Yönetici bulunamadı.',
      );
    }
    const permissions = body.permissions
      ? parseManagerPermissions(body.permissions)
      : parseManagerPermissions(row.permissions);
    const updated = await this.prisma.branchManager.update({
      where: { id: row.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.permissions ? { permissions } : {}),
      },
      include: { user: { select: { phoneE164: true } } },
    });
    if (body.status === 'revoked') {
      await this.membership.revokeManagerContext(
        managerUserId,
        ctx.employerId!,
      );
    } else {
      await this.membership.syncManagerSessionPermissions(
        managerUserId,
        ctx.employerId!,
        permissions,
      );
    }
    return {
      userId: updated.userId,
      status: updated.status,
      permissions,
      phoneE164: maskPhone(updated.user.phoneE164),
      branchId,
      scope: 'branch' as const,
    };
  }

  async patchBranchManagerInvite(
    userId: string,
    ctx: AuthContext,
    branchId: string,
    body: ManagerInvitePatchBody,
  ) {
    if (ctx.role !== 'employer') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Davet yetkisini yalnızca işveren değiştirir.',
      );
    }
    await this.getBranch(userId, ctx, branchId);
    const invite = await this.prisma.branchManagerInvite.findUnique({
      where: { branchId },
    });
    if (!invite) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Davet kodu yok.',
      );
    }
    const permissions = body.permissions
      ? parseManagerPermissions(body.permissions)
      : parseManagerPermissions(invite.permissions);
    const rotated = body.rotate
      ? await allocateUnusedManagerJoinCode(
          this.prisma,
          this.config.env.OTP_PEPPER,
        )
      : null;
    const expiresAt = rotated ? managerInviteExpiry() : invite.expiresAt;
    const updated = await this.prisma.branchManagerInvite.update({
      where: { id: invite.id },
      data: {
        ...(body.permissions ? { permissions } : {}),
        ...(rotated
          ? {
              joinCode: sealManagerJoinCode(
                rotated.joinCode,
                this.config.env.OTP_PEPPER,
              ),
              codeHash: rotated.codeHash,
              expiresAt,
              useCount: 0,
              status: 'active',
            }
          : {}),
      },
    });
    return {
      joinCode:
        revealManagerJoinCode(
          updated.joinCode,
          this.config.env.OTP_PEPPER,
        ) ?? rotated?.joinCode ?? '',
      expiresAt: updated.expiresAt.toISOString(),
      permissions,
    };
  }

  async adminCreateBranch(
    body: AdminBranchCreateBody,
    actorUserId: string,
    requestId: string,
  ) {
    assertValidCoordinates(body.latitude, body.longitude);
    const employer = await this.prisma.employer.findUnique({
      where: { id: body.employerId },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşyeri bulunamadı.',
      );
    }
    const owner = await this.prisma.employerMembership.findFirst({
      where: { employerId: body.employerId, role: 'owner', status: 'active' },
    });
    const invitedByUserId = owner?.userId ?? actorUserId;
    const { joinCode, codeHash } = await allocateUnusedManagerJoinCode(
      this.prisma,
      this.config.env.OTP_PEPPER,
    );
    const expiresAt = managerInviteExpiry();
    const branch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          employerId: body.employerId,
          publicCode: await allocatePublicCode(tx, PUBLIC_CODE_PREFIX.branch),
          name: body.name,
          addressLine1: body.addressLine1,
          city: body.city,
          latitude: new Prisma.Decimal(body.latitude),
          longitude: new Prisma.Decimal(body.longitude),
        },
      });
      await tx.branchManagerInvite.create({
        data: {
          branchId: created.id,
          joinCode: sealManagerJoinCode(joinCode, this.config.env.OTP_PEPPER),
          codeHash,
          expiresAt,
          invitedByUserId,
          permissions: [...branchManagerInviteDefaultPermissions],
        },
      });
      return created;
    });
    await this.audit.append({
      category: 'admin',
      action: 'branch_created',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'branch',
      resourceId: branch.id,
      requestId,
      metadata: { employerId: body.employerId, adminOverrideLimits: true },
    });
    return {
      ...this.mapBranch(branch),
      managerInviteCode: joinCode,
    };
  }

  async adminPatchBranch(
    branchId: string,
    body: AdminBranchPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Şube bulunamadı.',
      );
    }
    if (body.latitude !== undefined && body.longitude !== undefined) {
      assertValidCoordinates(body.latitude, body.longitude);
    } else if (body.latitude !== undefined || body.longitude !== undefined) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Enlem ve boylam birlikte güncellenmelidir.',
      );
    }
    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: body.name,
        addressLine1: body.addressLine1,
        city: body.city,
        status: body.status,
        latitude:
          body.latitude !== undefined
            ? new Prisma.Decimal(body.latitude)
            : undefined,
        longitude:
          body.longitude !== undefined
            ? new Prisma.Decimal(body.longitude)
            : undefined,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'branch_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'branch',
      resourceId: branchId,
      requestId,
      metadata: body,
    });
    return this.mapBranch(updated);
  }
}
