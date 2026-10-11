import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type AssignRoleBody,
  type AuthContext,
  type ContextSwitchBody,
  type IdentityLinkBody,
  type IdentityLoginBody,
  type IdentityProvider,
  type OtpRequestBody,
  type OtpVerifyBody,
} from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { istanbulCivil, istanbulInstant } from '../common/istanbul-civil.js';
import { hashPassword, passwordIsStrong, verifyPassword } from './password.js';
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
import {
  IdentityTokenError,
  verifyIdentityToken,
} from './identity-token.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESETS_PER_DAY = 2;

function istanbulDayStart(now = new Date()): Date {
  const civil = istanbulCivil(now);
  return istanbulInstant(civil.year, civil.month, civil.day, 0, 0);
}

function otpSkipsPassword(purpose: string): boolean {
  return (
    purpose === 'admin_login' ||
    purpose === 'verify_phone' ||
    purpose === 'step_up'
  );
}

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

  private assertPasswordAcceptable(password: string | undefined): string {
    if (!password || !passwordIsStrong(password)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Şifre en az 8 karakter olmalı ve harf ile rakam içermelidir.',
      );
    }
    return password;
  }

  async requestOtp(body: OtpRequestBody) {
    const phoneE164 = normalizePhoneE164(body.phone);
    await this.assertNotBanned(phoneE164);
    const requested = body.purpose ?? 'register';
    const existing = await this.prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true, passwordHash: true },
    });
    const purpose =
      requested === 'login' && !existing?.passwordHash ? 'register' : requested;

    if (purpose === 'login') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.PASSWORD_REQUIRED,
        'Giriş şifre ile yapılır. OTP kayıt ve şifre yenileme içindir.',
      );
    }

    if (purpose === 'password_reset') {
      if (!existing?.passwordHash) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          'Bu numara için kayıtlı şifre yok.',
        );
      }
      const usedToday = await this.prisma.otpChallenge.count({
        where: {
          phoneE164,
          purpose: 'password_reset',
          createdAt: { gte: istanbulDayStart() },
        },
      });
      if (usedToday >= PASSWORD_RESETS_PER_DAY) {
        throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          ErrorCode.PASSWORD_RESET_LIMIT,
          'Şifre yenileme hakkı günde iki kez kullanılabilir.',
        );
      }
    } else if (!otpSkipsPassword(purpose) && existing?.passwordHash) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.PASSWORD_REQUIRED,
        'Bu numara şifre ile giriş yapar. OTP kayıt ve şifre yenileme içindir.',
      );
    }

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

    let userId = existing?.id;
    if (!userId) {
      const created = await this.prisma.user.create({
        data: { phoneE164 },
      });
      userId = created.id;
    }

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId,
        phoneE164,
        codeHash,
        purpose,
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

    await this.assertIdentityAllowed(
      user.id,
      challenge.phoneE164,
      body.deviceId,
    );

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    if (challenge.purpose === 'admin_login' && !user.platformAdmin) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Admin erişimi yok.',
      );
    }

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

  async setPassword(userId: string, password: string): Promise<void> {
    const next = this.assertPasswordAcceptable(password);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Kullanıcı bulunamadı.',
      );
    }
    if (user.passwordHash) {
      const reset = await this.prisma.otpChallenge.findFirst({
        where: {
          userId,
          purpose: 'password_reset',
          consumedAt: { gte: new Date(Date.now() - OTP_TTL_MS) },
        },
      });
      if (!reset) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.CONFLICT,
          'Şifre zaten tanımlı. Yenilemek için OTP kullanın.',
        );
      }
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(next) },
    });
  }

  async loginWithPhonePassword(
    phone: string,
    password: string,
    userAgent?: string,
  ) {
    const phoneE164 = normalizePhoneE164(phone);
    const user = await this.prisma.user.findUnique({ where: { phoneE164 } });
    const matches = user?.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : false;
    if (!user || !matches) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'Telefon veya şifre hatalı.',
      );
    }
    await this.assertIdentityAllowed(user.id, phoneE164);
    const contexts = await this.membership.listContexts(user.id);
    const activeContext =
      contexts.length > 0
        ? this.membership.pickDefaultContext(contexts)
        : ({ role: 'worker' } as const);
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
    return {
      tokens: { ...sessionResult.tokens, ...access },
      user: await this.membership.toMeUser(user.id),
      contexts,
    };
  }

  async loginWithAdminPassword(
    email: string,
    password: string,
    userAgent?: string,
  ) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
      include: { user: true },
    });
    const matches = admin?.passwordHash
      ? await verifyPassword(password, admin.passwordHash)
      : false;
    if (!admin || !matches) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'E-posta veya parola hatalı.',
      );
    }
    if (admin.user.status === 'banned') {
      this.throwBanned();
    }
    await this.assertIdentityAllowed(admin.user.id, admin.user.phoneE164);
    const contexts = await this.membership.listContexts(admin.user.id);
    const activeContext = this.membership.assertContextAllowed(contexts, {
      role: 'admin',
    });
    const sessionResult = await this.sessions.createSession(
      admin.user.id,
      activeContext,
      userAgent,
    );
    const access = this.tokens.signAccess(
      admin.user.id,
      sessionResult.sessionId,
      activeContext,
    );
    const tokens: SessionIssueResult = {
      ...sessionResult.tokens,
      ...access,
    };
    const me = await this.membership.toMeUser(admin.user.id);
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

  identityProviders() {
    return {
      appleClientId: this.config.env.APPLE_CLIENT_ID ?? null,
      googleClientId: this.config.env.GOOGLE_CLIENT_ID ?? null,
    };
  }

  async listIdentities(userId: string) {
    const rows = await this.prisma.linkedIdentity.findMany({
      where: { userId },
      select: { provider: true, email: true },
    });
    return {
      items: rows.map((row) => ({
        provider: row.provider as IdentityProvider,
        email: row.email,
      })),
    };
  }

  async linkIdentity(userId: string, body: IdentityLinkBody) {
    const claims = await this.readIdentityClaims(body.provider, body.idToken);
    const existing = await this.prisma.linkedIdentity.findUnique({
      where: {
        provider_subject: { provider: body.provider, subject: claims.sub },
      },
    });
    if (existing && existing.userId !== userId) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu hesap başka bir kullanıcıya bağlı.',
      );
    }
    if (existing) {
      return { provider: body.provider, linked: true as const };
    }
    const mine = await this.prisma.linkedIdentity.findUnique({
      where: { userId_provider: { userId, provider: body.provider } },
    });
    if (mine) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu sağlayıcı zaten başka bir hesaba bağlı.',
      );
    }
    await this.prisma.linkedIdentity.create({
      data: {
        userId,
        provider: body.provider,
        subject: claims.sub,
        email: claims.email,
      },
    });
    return { provider: body.provider, linked: true as const };
  }

  async loginWithIdentity(body: IdentityLoginBody, userAgent?: string) {
    const claims = await this.readIdentityClaims(body.provider, body.idToken);
    const link = await this.prisma.linkedIdentity.findUnique({
      where: {
        provider_subject: { provider: body.provider, subject: claims.sub },
      },
    });
    if (!link) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.IDENTITY_NOT_LINKED,
        'Bu hesap bağlı değil. Önce telefon numarasıyla kayıt olun, sonra profilde bağlayın.',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: link.userId },
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.IDENTITY_NOT_LINKED,
        'Bu hesap bağlı değil. Önce telefon numarasıyla kayıt olun, sonra profilde bağlayın.',
      );
    }
    return this.issueSession(user.id, user.phoneE164, body.deviceId, userAgent);
  }

  private async readIdentityClaims(provider: IdentityProvider, idToken: string) {
    const settings = this.identitySettings(provider);
    let testJwk: { kty: 'RSA'; n: string; e: string; kid?: string } | undefined;
    const testJwkRaw =
      process.env.NODE_ENV === 'test'
        ? (this.config.env.IDENTITY_TEST_JWK ?? process.env.IDENTITY_TEST_JWK)
        : undefined;
    if (testJwkRaw) {
      testJwk = JSON.parse(testJwkRaw) as {
        kty: 'RSA';
        n: string;
        e: string;
        kid?: string;
      };
    }
    const testAudience =
      process.env.NODE_ENV === 'test'
        ? process.env[provider === 'apple' ? 'APPLE_CLIENT_ID' : 'GOOGLE_CLIENT_ID']
        : undefined;
    const audience = testAudience ?? settings.audience;
    try {
      return await verifyIdentityToken(idToken, {
        issuer: settings.issuer,
        audience,
        jwksUrl: settings.jwksUrl,
        testJwk,
      });
    } catch (error) {
      if (
        error instanceof IdentityTokenError &&
        error.reason === 'unconfigured'
      ) {
        throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.IDENTITY_NOT_CONFIGURED,
          'Bu giriş yöntemi henüz yapılandırılmadı.',
        );
      }
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.IDENTITY_TOKEN_INVALID,
        'Kimlik doğrulanamadı.',
      );
    }
  }

  private identitySettings(provider: IdentityProvider): {
    issuer: string;
    jwksUrl: string;
    audience: string | undefined;
  } {
    switch (provider) {
      case 'apple':
        return {
          issuer: 'https://appleid.apple.com',
          jwksUrl: 'https://appleid.apple.com/auth/keys',
          audience: this.config.env.APPLE_CLIENT_ID,
        };
      case 'google':
        return {
          issuer: 'https://accounts.google.com',
          jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
          audience: this.config.env.GOOGLE_CLIENT_ID,
        };
      default: {
        const neverProvider: never = provider;
        return neverProvider;
      }
    }
  }

  private async issueSession(
    userId: string,
    phoneE164: string,
    deviceId: string | undefined,
    userAgent?: string,
  ) {
    await this.assertIdentityAllowed(userId, phoneE164, deviceId);
    const contexts = await this.membership.listContexts(userId);
    const activeContext =
      contexts.length > 0
        ? this.membership.pickDefaultContext(contexts)
        : { role: 'worker' as const };
    const sessionResult = await this.sessions.createSession(
      userId,
      activeContext,
      userAgent,
    );
    const access = this.tokens.signAccess(
      userId,
      sessionResult.sessionId,
      activeContext,
    );
    const tokens: SessionIssueResult = {
      ...sessionResult.tokens,
      ...access,
    };
    const me = await this.membership.toMeUser(userId);
    return { tokens, user: me, contexts };
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
