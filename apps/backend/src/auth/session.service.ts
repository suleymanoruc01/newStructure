import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { AuthContext } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  hashRefreshToken,
  newCsrfToken,
  newRefreshToken,
} from './auth.crypto.js';
import type { SessionIssueResult } from './auth.types.js';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private refreshExpiry(): Date {
    const days = this.config.env.JWT_REFRESH_TTL_DAYS;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async createSession(
    userId: string,
    activeContext: AuthContext,
    userAgent?: string,
  ): Promise<{ sessionId: string; tokens: SessionIssueResult }> {
    const refreshToken = newRefreshToken();
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.config.env.OTP_PEPPER,
    );
    const expiresAt = this.refreshExpiry();
    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        activeContext,
        userAgent,
        expiresAt,
      },
    });
    const csrfToken = newCsrfToken();
    return {
      sessionId: session.id,
      tokens: {
        refreshToken,
        refreshExpiresAt: expiresAt,
        csrfToken,
        accessToken: '',
        accessExpiresAt: '',
      },
    };
  }

  async rotateSession(
    refreshToken: string,
    userAgent?: string,
  ): Promise<{
    sessionId: string;
    userId: string;
    activeContext: AuthContext;
    tokens: SessionIssueResult;
  }> {
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.config.env.OTP_PEPPER,
    );
    const existing = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.SESSION_EXPIRED,
        'Oturum süresi doldu.',
      );
    }
    const newRefresh = newRefreshToken();
    const newHash = hashRefreshToken(newRefresh, this.config.env.OTP_PEPPER);
    const expiresAt = this.refreshExpiry();
    const csrfToken = newCsrfToken();

    await this.prisma.$transaction([
      this.prisma.refreshSession.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshSession.create({
        data: {
          userId: existing.userId,
          tokenHash: newHash,
          rotatedFromId: existing.id,
          activeContext: existing.activeContext ?? { role: 'worker' },
          userAgent,
          expiresAt,
        },
      }),
    ]);

    const created = await this.prisma.refreshSession.findFirst({
      where: { tokenHash: newHash },
      orderBy: { createdAt: 'desc' },
    });
    if (!created) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Oturum oluşturulamadı.',
      );
    }

    const ctx = (created.activeContext ?? { role: 'worker' }) as AuthContext;
    return {
      sessionId: created.id,
      userId: created.userId,
      activeContext: ctx,
      tokens: {
        refreshToken: newRefresh,
        refreshExpiresAt: expiresAt,
        csrfToken,
        accessToken: '',
        accessExpiresAt: '',
      },
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async assertSessionActive(sessionId: string): Promise<void> {
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { status: true, phoneE164: true } } },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.SESSION_EXPIRED,
        'Oturum süresi doldu.',
      );
    }
    if (session.user.status === 'banned') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED,
        'Hesap erişime kapalı.',
      );
    }
    const ban = await this.prisma.authBan.findFirst({
      where: { phoneE164: session.user.phoneE164 },
    });
    if (ban) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED,
        'Hesap erişime kapalı.',
      );
    }
  }

  async updateSessionContext(
    sessionId: string,
    context: AuthContext,
  ): Promise<void> {
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { activeContext: context },
    });
  }
}
