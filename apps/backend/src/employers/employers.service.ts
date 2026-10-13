import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  workplaceManagerInviteDefaultPermissions,
  type EmployerCreateBody,
  type EmployerPatchBody,
  type ManagerAssignmentPatchBody,
  type ManagerInvitePatchBody,
} from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import {
  PUBLIC_CODE_PREFIX,
  allocatePublicCode,
} from '../common/public-code.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionService } from '../auth/session.service.js';
import { TokenService } from '../auth/token.service.js';
import { parseManagerPermissions } from '../auth/manager-permissions.js';
import { MembershipService } from '../auth/membership.service.js';

function maskPhone(phone: string): string {
  if (phone.length < 8) {
    return phone;
  }
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}
import {
  hashRefreshToken,
  newRefreshToken,
  revealManagerJoinCode,
  sealManagerJoinCode,
} from '../auth/auth.crypto.js';
import {
  allocateUnusedManagerJoinCode,
  managerInviteExpiry,
} from '../auth/manager-invite.js';
import { AppConfigService } from '../config/app-config.service.js';
@Injectable()
export class EmployersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly membership: MembershipService,
    private readonly config: AppConfigService,
  ) {}

  private mapEmployer(
    employer: {
      id: string;
      legalName: string;
      tradingName: string | null;
      taxId: string;
      publicCode: string;
      industryCodes: unknown;
      addressLine1?: string | null;
      city?: string | null;
      latitude?: Prisma.Decimal | null;
      longitude?: Prisma.Decimal | null;
      verificationStatus: string;
    },
    extras?: { managerInviteCode?: string },
  ) {
    const codes = Array.isArray(employer.industryCodes)
      ? (employer.industryCodes as string[])
      : [];
    return {
      id: employer.id,
      legalName: employer.legalName,
      tradingName: employer.tradingName,
      taxId: employer.taxId,
      publicCode: employer.publicCode,
      industryCodes: codes,
      addressLine1: employer.addressLine1 ?? null,
      city: employer.city ?? null,
      latitude:
        employer.latitude != null ? Number(employer.latitude) : null,
      longitude:
        employer.longitude != null ? Number(employer.longitude) : null,
      verificationStatus: employer.verificationStatus as
        | 'pending'
        | 'verified'
        | 'rejected'
        | 'bypass',
      ...(extras?.managerInviteCode
        ? { managerInviteCode: extras.managerInviteCode }
        : {}),
    };
  }

  private locationData(body: {
    addressLine1?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (body.latitude !== undefined && body.longitude !== undefined) {
      assertValidCoordinates(body.latitude, body.longitude);
    }
    return {
      addressLine1: body.addressLine1,
      city: body.city,
      latitude:
        body.latitude !== undefined
          ? new Prisma.Decimal(body.latitude)
          : undefined,
      longitude:
        body.longitude !== undefined
          ? new Prisma.Decimal(body.longitude)
          : undefined,
    };
  }

  async createEmployer(
    userId: string,
    sessionId: string,
    body: EmployerCreateBody,
  ) {
    const ban = await this.prisma.authBan.findFirst({
      where: { taxId: body.taxId },
    });
    if (ban) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED,
        'Hesap erişime kapalı.',
      );
    }

    const existingTax = await this.prisma.employer.findUnique({
      where: { taxId: body.taxId },
    });
    if (existingTax) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu vergi numarası zaten kayıtlı.',
      );
    }

    const employer = await this.prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { id: userId } });
      if (owner && !owner.employerPublicCode) {
        await tx.user.update({
          where: { id: userId },
          data: {
            employerPublicCode: await allocatePublicCode(
              tx,
              PUBLIC_CODE_PREFIX.employer,
            ),
          },
        });
      }
      const created = await tx.employer.create({
        data: {
          legalName: body.legalName,
          tradingName: body.tradingName,
          taxId: body.taxId,
          industryCodes: body.industryCodes ?? [],
          publicCode: await allocatePublicCode(tx, PUBLIC_CODE_PREFIX.workplace),
          ...this.locationData(body),
        },
      });
      await tx.employerMembership.create({
        data: {
          userId,
          employerId: created.id,
          role: 'owner',
        },
      });
      await tx.tokenAccount.create({
        data: {
          employerId: created.id,
          balance: this.config.env.TOKEN_STARTING_BALANCE,
        },
      });
      return created;
    });

    const activeContext = {
      role: 'employer' as const,
      employerId: employer.id,
    };
    await this.sessions.updateSessionContext(sessionId, activeContext);

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
      data: { tokenHash, expiresAt, activeContext },
    });

    const access = this.tokens.signAccess(userId, sessionId, activeContext);

    return {
      employer: this.mapEmployer(employer),
      accessToken: access.accessToken,
      accessExpiresAt: access.accessExpiresAt,
      refreshToken,
      user: await this.membership.toMeUser(userId, activeContext),
    };
  }

  async getEmployerForUser(userId: string, employerId?: string) {
    const membership = await this.prisma.employerMembership.findFirst({
      where: {
        userId,
        status: 'active',
        ...(employerId ? { employerId } : {}),
      },
      include: { employer: true },
      orderBy: { createdAt: 'asc' },
    });
    if (membership) {
      const invite = await this.prisma.workplaceManagerInvite.findUnique({
        where: { employerId: membership.employerId },
      });
      return this.mapEmployer(membership.employer, {
        managerInviteCode:
          invite?.status === 'active'
            ? revealManagerJoinCode(
                invite.joinCode,
                this.config.env.OTP_PEPPER,
              )
            : undefined,
      });
    }
    if (employerId) {
      const workplaceMgr = await this.prisma.workplaceManager.findFirst({
        where: { userId, employerId, status: 'active' },
        include: { employer: true },
      });
      if (workplaceMgr) {
        return this.mapEmployer(workplaceMgr.employer);
      }
      const branchMgr = await this.prisma.branchManager.findFirst({
        where: {
          userId,
          status: 'active',
          branch: { employerId },
        },
        include: { branch: { include: { employer: true } } },
      });
      if (branchMgr) {
        return this.mapEmployer(branchMgr.branch.employer);
      }
    }
    throw new ApiException(
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      'İşveren kaydı bulunamadı.',
    );
  }

  async patchEmployer(
    userId: string,
    employerId: string,
    body: EmployerPatchBody,
  ) {
    await this.assertMembership(userId, employerId);
    const location = this.locationData(body);
    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        legalName: body.legalName,
        tradingName: body.tradingName,
        industryCodes: body.industryCodes,
        ...location,
      },
    });
    return this.mapEmployer(updated);
  }

  async listWorkplaces(userId: string) {
    const memberships = await this.prisma.employerMembership.findMany({
      where: { userId, status: 'active' },
      include: { employer: true },
      orderBy: { createdAt: 'asc' },
    });
    return { items: memberships.map((row) => this.mapEmployer(row.employer)) };
  }

  async getOrCreateWorkplaceInvite(userId: string, employerId: string) {
    await this.assertMembership(userId, employerId);
    const existing = await this.prisma.workplaceManagerInvite.findUnique({
      where: { employerId },
    });
    if (existing && existing.status === 'active') {
      return {
        joinCode:
          revealManagerJoinCode(
            existing.joinCode,
            this.config.env.OTP_PEPPER,
          ) ?? existing.joinCode,
        expiresAt: existing.expiresAt.toISOString(),
        permissions: parseManagerPermissions(existing.permissions),
      };
    }
    const { joinCode, codeHash } = await allocateUnusedManagerJoinCode(
      this.prisma,
      this.config.env.OTP_PEPPER,
    );
    const expiresAt = managerInviteExpiry();
    const permissions = [...workplaceManagerInviteDefaultPermissions];
    const sealed = sealManagerJoinCode(joinCode, this.config.env.OTP_PEPPER);
    await this.prisma.workplaceManagerInvite.upsert({
      where: { employerId },
      create: {
        employerId,
        joinCode: sealed,
        codeHash,
        expiresAt,
        invitedByUserId: userId,
        permissions,
      },
      update: {
        joinCode: sealed,
        codeHash,
        expiresAt,
        status: 'active',
        useCount: 0,
        invitedByUserId: userId,
        permissions,
      },
    });
    return {
      joinCode,
      expiresAt: expiresAt.toISOString(),
      permissions,
    };
  }

  async listWorkplaceManagers(userId: string, employerId: string) {
    await this.assertMembership(userId, employerId);
    const managers = await this.prisma.workplaceManager.findMany({
      where: { employerId },
      include: { user: { select: { phoneE164: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const invite = await this.prisma.workplaceManagerInvite.findUnique({
      where: { employerId },
    });
    return {
      items: managers.map((row) => ({
        userId: row.userId,
        status: row.status,
        permissions: parseManagerPermissions(row.permissions),
        phoneE164: maskPhone(row.user.phoneE164),
        branchId: null,
        scope: 'workplace' as const,
      })),
      inviteCode: revealManagerJoinCode(
        invite?.joinCode,
        this.config.env.OTP_PEPPER,
      ),
      invitePermissions: parseManagerPermissions(invite?.permissions),
    };
  }

  async patchWorkplaceManager(
    userId: string,
    employerId: string,
    managerUserId: string,
    body: ManagerAssignmentPatchBody,
  ) {
    await this.assertMembership(userId, employerId);
    const row = await this.prisma.workplaceManager.findUnique({
      where: {
        userId_employerId: { userId: managerUserId, employerId },
      },
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
    const updated = await this.prisma.workplaceManager.update({
      where: { id: row.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.permissions ? { permissions } : {}),
      },
      include: { user: { select: { phoneE164: true } } },
    });
    if (body.status === 'revoked') {
      await this.membership.revokeManagerContext(managerUserId, employerId);
    } else {
      await this.membership.syncManagerSessionPermissions(
        managerUserId,
        employerId,
        permissions,
      );
    }
    return {
      userId: updated.userId,
      status: updated.status,
      permissions,
      phoneE164: maskPhone(updated.user.phoneE164),
      branchId: null,
      scope: 'workplace' as const,
    };
  }

  async patchWorkplaceManagerInvite(
    userId: string,
    employerId: string,
    body: ManagerInvitePatchBody,
  ) {
    await this.assertMembership(userId, employerId);
    const invite = await this.prisma.workplaceManagerInvite.findUnique({
      where: { employerId },
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
    const updated = await this.prisma.workplaceManagerInvite.update({
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

  private async assertMembership(userId: string, employerId: string) {
    const membership = await this.prisma.employerMembership.findFirst({
      where: { userId, employerId, status: 'active' },
    });
    if (!membership) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu işverene erişiminiz yok.',
      );
    }
  }

  async getSetupStatus(userId: string, employerId?: string) {
    const employer = await this.getEmployerForUser(userId, employerId).catch(
      () => null,
    );
    if (!employer) {
      return { complete: false, missing: ['employer'] };
    }
    const missing: string[] = [];
    if (employer.industryCodes.length === 0) {
      missing.push('industries');
    }
    return { complete: missing.length === 0, missing };
  }
}
