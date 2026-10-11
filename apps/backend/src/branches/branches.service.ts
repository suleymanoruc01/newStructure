import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type BranchCreateBody,
  type BranchPatchBody,
} from '@parton/api-contracts';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthContext } from '@parton/api-contracts';

import {
  generateManagerJoinCode,
  hashManagerJoinCode,
  hashRefreshToken,
  newRefreshToken,
  verifyManagerJoinCode,
} from '../auth/auth.crypto.js';
import { MembershipService } from '../auth/membership.service.js';
import { SessionService } from '../auth/session.service.js';
import { TokenService } from '../auth/token.service.js';
import { ApiException } from '../common/api.exception.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly membership: MembershipService,
    private readonly config: AppConfigService,
  ) {}

  private mapBranch(branch: {
    id: string;
    employerId: string;
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
    if (ctx.role === 'employer' && ctx.employerId) {
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
    if (ctx.role === 'manager' && ctx.employerId) {
      return ctx.employerId;
    }
    throw new ApiException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'Şube işlemi için işveren bağlamı gerekli.',
    );
  }

  async listBranches(userId: string, ctx: AuthContext) {
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      const branches = await this.prisma.branch.findMany({
        where: { id: { in: ctx.branchIds } },
        orderBy: { createdAt: 'asc' },
      });
      return { items: branches.map((b) => this.mapBranch(b)) };
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
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      if (!ctx.branchIds.includes(branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şubeye erişiminiz yok.',
        );
      }
      return this.mapBranch(branch);
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
        managerInviteCode: invite?.joinCode,
      };
    }
    return mapped;
  }

  async createBranch(
    userId: string,
    ctx: AuthContext,
    body: BranchCreateBody,
  ) {
    assertValidCoordinates(body.latitude, body.longitude);
    const employerId = await this.resolveEmployerId(userId, ctx);
    const joinCode = generateManagerJoinCode();
    const codeHash = hashManagerJoinCode(joinCode, this.config.env.OTP_PEPPER);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const branch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          employerId,
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
          joinCode,
          codeHash,
          expiresAt,
          invitedByUserId: userId,
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

    const branch = invite.branch;
    if (branch.status !== 'active') {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.CONFLICT,
        'Şube aktif değil.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.branchManager.upsert({
        where: {
          userId_branchId: { userId, branchId: branch.id },
        },
        create: {
          userId,
          branchId: branch.id,
          invitedByUserId: invite.invitedByUserId,
          status: 'active',
        },
        update: { status: 'active' },
      });
      await tx.branchManagerInvite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });
    });

    const activeContext = {
      role: 'manager' as const,
      employerId: branch.employerId,
      branchIds: [branch.id],
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
    const user = await this.membership.toMeUser(userId, activeContext);

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        employerId: branch.employerId,
        employerName: branch.employer.legalName,
      },
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
}
