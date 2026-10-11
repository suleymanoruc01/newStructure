import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type EmployerCreateBody,
  type EmployerPatchBody,
} from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionService } from '../auth/session.service.js';
import { TokenService } from '../auth/token.service.js';
import { MembershipService } from '../auth/membership.service.js';
import { hashRefreshToken, newRefreshToken } from '../auth/auth.crypto.js';
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

  private mapEmployer(employer: {
    id: string;
    legalName: string;
    tradingName: string | null;
    taxId: string;
    industryCodes: unknown;
    verificationStatus: string;
  }) {
    const codes = Array.isArray(employer.industryCodes)
      ? (employer.industryCodes as string[])
      : [];
    return {
      id: employer.id,
      legalName: employer.legalName,
      tradingName: employer.tradingName,
      taxId: employer.taxId,
      industryCodes: codes,
      verificationStatus: employer.verificationStatus as
        | 'pending'
        | 'verified'
        | 'rejected'
        | 'bypass',
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
      const created = await tx.employer.create({
        data: {
          legalName: body.legalName,
          tradingName: body.tradingName,
          taxId: body.taxId,
          industryCodes: body.industryCodes ?? [],
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
    if (!membership) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren kaydı bulunamadı.',
      );
    }
    return this.mapEmployer(membership.employer);
  }

  async patchEmployer(
    userId: string,
    employerId: string,
    body: EmployerPatchBody,
  ) {
    await this.assertMembership(userId, employerId);
    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        legalName: body.legalName,
        tradingName: body.tradingName,
        industryCodes: body.industryCodes,
      },
    });
    return this.mapEmployer(updated);
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
    const branchCount = await this.prisma.branch.count({
      where: { employerId: employer.id, status: 'active' },
    });
    const missing: string[] = [];
    if (employer.industryCodes.length === 0) {
      missing.push('industries');
    }
    if (branchCount === 0) {
      missing.push('branch');
    }
    return { complete: missing.length === 0, missing };
  }
}
