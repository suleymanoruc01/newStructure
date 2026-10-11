import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type AssignRoleBody,
  type AuthContext,
  type ContextSwitchBody,
  type OtpRequestBody,
  type OtpVerifyBody,
} from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  generateOtpCode,
  hashDeviceId,
  hashOtp,
  hashRefreshToken,
  newRefreshToken,
  verifyOtpHash,
} from './auth.crypto.js';
import { MembershipService } from './membership.service.js';
import { normalizePhoneE164 } from './phone.util.js';
import { SessionService } from './session.service.js';
import { SmsService } from './sms.service.js';
import { TokenService } from './token.service.js';
import type { SessionIssueResult } from './auth.types.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly sms: SmsService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly membership: MembershipService,
  ) {}

  private throwBanned(): never {
    throw new ApiException(
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_BANNED,
      'Hesap erişime kapalı.',
    );
  }

  private async assertNotBanned(phoneE164: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { phoneE164 },
      select: { status: true },
    });
    if (user?.status === 'banned') {
      this.throwBanned();
    }
    const ban = await this.prisma.authBan.findFirst({
      where: { phoneE164 },
    });
    if (ban) {
      this.throwBanned();
    }
  }

  private async assertIdentityAllowed(
    userId: string,
    phoneE164: string,
    deviceId?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (user?.status === 'banned') {
      this.throwBanned();
    }

    const memberships = await this.prisma.employerMembership.findMany({
      where: { userId },
      select: { employer: { select: { taxId: true } } },
    });
    const taxIds = memberships
      .map((row) => row.employer.taxId)
      .filter((taxId): taxId is string => Boolean(taxId));
    const deviceHash = deviceId
      ? hashDeviceId(deviceId, this.config.env.OTP_PEPPER)
      : undefined;

    const ban = await this.prisma.authBan.findFirst({
      where: {
        OR: [
          { phoneE164 },
          ...(taxIds.length > 0 ? [{ taxId: { in: taxIds } }] : []),
          ...(deviceHash ? [{ deviceHash }] : []),
        ],
      },
    });
    if (ban) {
      this.throwBanned();
    }

    if (!deviceHash) {
      return;
    }

    await this.prisma.deviceFingerprint.upsert({
      where: { userId_hash: { userId, hash: deviceHash } },
      create: { userId, hash: deviceHash },
      update: {},
    });
    const peers = await this.prisma.deviceFingerprint.findMany({
      where: { hash: deviceHash, userId: { not: userId } },
      select: { userId: true },
      take: 20,
    });
    if (peers.length === 0) {
      return;
    }
    await this.prisma.riskEvent.create({
      data: {
        userId,
        type: 'multi_account_device',
        score: 5,
        metadata: { peerUserIds: peers.map((peer) => peer.userId) },
      },
    });
  }

  async requestOtp(body: OtpRequestBody) {
    const phoneE164 = normalizePhoneE164(body.phone);
    await this.assertNotBanned(phoneE164);

    const recent = await this.prisma.otpChallenge.findFirst({
      where: { phoneE164 },
      orderBy: { createdAt: 'desc' },
    });
    if (
      recent &&
      !recent.consumedAt &&
      recent.createdAt.getTime() + RESEND_COOLDOWN_MS > Date.now()
    ) {
      throw new ApiException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMITED,
        'Yeni kod için lütfen bekleyin.',
      );
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code, this.config.env.OTP_PEPPER);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    let user = await this.prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phoneE164 },
      });
    }

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId: user.id,
        phoneE164,
        codeHash,
        purpose: body.purpose ?? 'login',
        expiresAt,
      },
    });

    await this.sms.sendOtp(phoneE164, code);

    return {
      challengeId: challenge.id,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(
        Date.now() + RESEND_COOLDOWN_MS,
      ).toISOString(),
    };
  }

  async verifyOtp(body: OtpVerifyBody, userAgent?: string) {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: body.challengeId },
    });
    if (!challenge || challenge.consumedAt) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'Doğrulama kodu geçersiz.',
      );
    }
    if (challenge.expiresAt <= new Date()) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_EXPIRED,
        'Doğrulama kodunun süresi doldu.',
      );
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.RATE_LIMITED,
        'Çok fazla hatalı deneme.',
      );
    }

    const valid = verifyOtpHash(
      body.code,
      this.config.env.OTP_PEPPER,
      challenge.codeHash,
    );
    if (!valid) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'Doğrulama kodu geçersiz.',
      );
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { phoneE164: challenge.phoneE164 },
      include: { platformAdmin: true },
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Kullanıcı bulunamadı.',
      );
    }

    if (challenge.purpose === 'admin_login' && !user.platformAdmin) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Admin erişimi yok.',
      );
    }

    await this.assertIdentityAllowed(
      user.id,
      challenge.phoneE164,
      body.deviceId,
    );

    const contexts = await this.membership.listContexts(user.id);
    let activeContext: AuthContext;
    if (body.roleIntent) {
      activeContext = { role: body.roleIntent };
      if (body.roleIntent === 'admin' && !user.platformAdmin) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Admin erişimi yok.',
        );
      }
    } else if (contexts.length > 0) {
      activeContext = this.membership.pickDefaultContext(contexts);
    } else {
      activeContext = { role: 'worker' };
    }

    const sessionResult = await this.sessions.createSession(
      user.id,
      activeContext,
      userAgent,
    );
    const access = this.tokens.signAccess(
      user.id,
      sessionResult.sessionId,
      activeContext,
    );
    const tokens: SessionIssueResult = {
      ...sessionResult.tokens,
      ...access,
    };

    const me = await this.membership.toMeUser(user.id);
    return { tokens, user: me, contexts };
  }

  async refresh(refreshToken: string, userAgent?: string) {
    const rotated = await this.sessions.rotateSession(refreshToken, userAgent);
    const access = this.tokens.signAccess(
      rotated.userId,
      rotated.sessionId,
      rotated.activeContext,
    );
    return {
      tokens: { ...rotated.tokens, ...access },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revokeSession(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId);
  }

  async listContexts(userId: string) {
    const items = await this.membership.listContexts(userId);
    return { items };
  }

  async switchContext(
    userId: string,
    sessionId: string,
    body: ContextSwitchBody,
  ) {
    const contexts = await this.membership.listContexts(userId);
    const active = this.membership.assertContextAllowed(contexts, body);
    await this.sessions.updateSessionContext(sessionId, active);
    const access = this.tokens.signAccess(userId, sessionId, active);
    const me = await this.membership.toMeUser(userId);
    return { access, user: me, contexts };
  }

  async assignRole(userId: string, sessionId: string, body: AssignRoleBody) {
    const role = body.role;
    if (role === 'worker') {
      await this.prisma.workerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    } else if (role === 'admin') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Admin rolü atanamaz.',
      );
    } else if (role === 'employer') {
      // Org is created via POST /api/v1/employers during onboarding.
    } else if (role === 'manager') {
      // Branch binding via POST /api/v1/branches/manager-join during onboarding.
    }

    const contexts = await this.membership.listContexts(userId);
    let active =
      contexts.find((c) => c.role === role) ??
      (role === 'worker'
        ? { role: 'worker' as const }
        : role === 'employer'
          ? { role: 'employer' as const }
          : role === 'manager'
            ? { role: 'manager' as const }
            : null);
    if (!active) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.ONBOARDING_REQUIRED,
        'Rol henüz kullanılamıyor.',
      );
    }
    await this.sessions.updateSessionContext(sessionId, active);

    const refreshToken = await this.issueFreshRefreshForSession(sessionId);
    const access = this.tokens.signAccess(userId, sessionId, active);
    const me = await this.membership.toMeUser(userId, active);
    return {
      user: me,
      contexts,
      accessToken: access.accessToken,
      refreshToken,
    };
  }

  private async issueFreshRefreshForSession(sessionId: string): Promise<string> {
    const refreshToken = newRefreshToken();
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.config.env.OTP_PEPPER,
    );
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: {
        tokenHash,
        expiresAt: new Date(
          Date.now() +
            this.config.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });
    return refreshToken;
  }

  async getMe(userId: string, activeContext?: AuthContext) {
    return this.membership.toMeUser(userId, activeContext);
  }

  async patchMe(userId: string, locale?: string) {
    if (locale) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { locale },
      });
    }
    return this.membership.toMeUser(userId);
  }
}
