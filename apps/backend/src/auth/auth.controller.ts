import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import {
  adminPasswordLoginBodySchema,
  assignRoleBodySchema,
  contextSwitchBodySchema,
  identityLinkBodySchema,
  identityLoginBodySchema,
  mePatchBodySchema,
  otpRequestBodySchema,
  otpVerifyBodySchema,
  phonePasswordLoginBodySchema,
  setPasswordBodySchema,
  tokenRefreshBodySchema,
} from '@parton/api-contracts';
import type { Request, Response } from 'express';

import { ApiException } from '../common/api.exception.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AppConfigService } from '../config/app-config.service.js';
import {
  clearAuthCookies,
  readRefreshFromRequest,
  setAuthCookies,
} from './auth.cookies.js';
import { AuthService } from './auth.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post('auth/admin/login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async adminPasswordLogin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(adminPasswordLoginBodySchema)) body: unknown,
  ) {
    const parsed = adminPasswordLoginBodySchema.parse(body);
    const result = await this.auth.loginWithAdminPassword(
      parsed.email,
      parsed.password,
      req.headers['user-agent'],
    );
    setAuthCookies(
      res,
      this.config,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
      result.tokens.csrfToken,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.tokens.accessToken,
      accessExpiresAt: result.tokens.accessExpiresAt,
      tokenType: 'Bearer' as const,
      refreshToken: result.tokens.refreshToken,
      user: result.user,
      contexts: result.contexts,
    });
  }

  @Post('auth/login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async phonePasswordLogin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(phonePasswordLoginBodySchema)) body: unknown,
  ) {
    const parsed = phonePasswordLoginBodySchema.parse(body);
    const result = await this.auth.loginWithPhonePassword(
      parsed.phone,
      parsed.password,
      req.headers['user-agent'],
    );
    setAuthCookies(
      res,
      this.config,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
      result.tokens.csrfToken,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.tokens.accessToken,
      accessExpiresAt: result.tokens.accessExpiresAt,
      tokenType: 'Bearer' as const,
      refreshToken: result.tokens.refreshToken,
      user: result.user,
      contexts: result.contexts,
    });
  }

  @Post('auth/password')
  @UseGuards(JwtAuthGuard)
  async setPassword(
    @Req() req: Request,
    @Body(new ZodValidationPipe(setPasswordBodySchema)) body: unknown,
  ) {
    const parsed = setPasswordBodySchema.parse(body);
    await this.auth.setPassword(req.userId!, parsed.password);
    return successResponse(req.requestId ?? '', { ok: true as const });
  }

  @Post('auth/otp/request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async otpRequest(
    @Req() req: Request,
    @Body(new ZodValidationPipe(otpRequestBodySchema)) body: unknown,
  ) {
    const data = await this.auth.requestOtp(
      otpRequestBodySchema.parse(body),
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('auth/otp/verify')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async otpVerify(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(otpVerifyBodySchema)) body: unknown,
  ) {
    const parsed = otpVerifyBodySchema.parse(body);
    const result = await this.auth.verifyOtp(
      parsed,
      req.headers['user-agent'],
    );
    setAuthCookies(
      res,
      this.config,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
      result.tokens.csrfToken,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.tokens.accessToken,
      accessExpiresAt: result.tokens.accessExpiresAt,
      tokenType: 'Bearer' as const,
      refreshToken: result.tokens.refreshToken,
      user: result.user,
      contexts: result.contexts,
    });
  }

  @Post('auth/token/refresh')
  @UseGuards(CsrfGuard)
  async tokenRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(tokenRefreshBodySchema)) body: unknown,
  ) {
    tokenRefreshBodySchema.parse(body);
    const refreshToken = readRefreshFromRequest(req, this.config);
    if (!refreshToken) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.SESSION_EXPIRED,
        'Oturum süresi doldu.',
      );
    }
    const result = await this.auth.refresh(
      refreshToken,
      req.headers['user-agent'],
    );
    setAuthCookies(
      res,
      this.config,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
      result.tokens.csrfToken,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.tokens.accessToken,
      accessExpiresAt: result.tokens.accessExpiresAt,
      tokenType: 'Bearer' as const,
      refreshToken: result.tokens.refreshToken,
    });
  }

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.sessionId) {
      await this.auth.logout(req.sessionId);
    }
    clearAuthCookies(res, this.config);
    return successResponse(req.requestId ?? '', { ok: true });
  }

  @Post('auth/logout-all')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.userId) {
      await this.auth.logoutAll(req.userId);
    }
    clearAuthCookies(res, this.config);
    return successResponse(req.requestId ?? '', { ok: true });
  }

  @Get('auth/identity-providers')
  identityProviders(@Req() req: Request) {
    return successResponse(
      req.requestId ?? '',
      this.auth.identityProviders(),
    );
  }

  @Get('auth/identities')
  @UseGuards(JwtAuthGuard)
  async identities(@Req() req: Request) {
    const data = await this.auth.listIdentities(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('auth/identities/link')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async linkIdentity(
    @Req() req: Request,
    @Body(new ZodValidationPipe(identityLinkBodySchema)) body: unknown,
  ) {
    const data = await this.auth.linkIdentity(
      req.userId!,
      identityLinkBodySchema.parse(body),
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('auth/identities/login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async identityLogin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(identityLoginBodySchema)) body: unknown,
  ) {
    const parsed = identityLoginBodySchema.parse(body);
    const result = await this.auth.loginWithIdentity(
      parsed,
      req.headers['user-agent'],
    );
    setAuthCookies(
      res,
      this.config,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
      result.tokens.csrfToken,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.tokens.accessToken,
      accessExpiresAt: result.tokens.accessExpiresAt,
      tokenType: 'Bearer' as const,
      refreshToken: result.tokens.refreshToken,
      user: result.user,
      contexts: result.contexts,
    });
  }

  @Get('auth/contexts')
  @UseGuards(JwtAuthGuard)
  async contexts(@Req() req: Request) {
    const data = await this.auth.listContexts(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('auth/context')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async switchContext(
    @Req() req: Request,
    @Body(new ZodValidationPipe(contextSwitchBodySchema)) body: unknown,
  ) {
    const parsed = contextSwitchBodySchema.parse(body);
    const result = await this.auth.switchContext(
      req.userId!,
      req.sessionId!,
      parsed,
    );
    return successResponse(req.requestId ?? '', {
      accessToken: result.access.accessToken,
      accessExpiresAt: result.access.accessExpiresAt,
      tokenType: 'Bearer' as const,
      user: result.user,
      contexts: result.contexts,
    });
  }
}

@Controller()
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = await this.auth.getMe(req.userId!, req.authContext);
    return successResponse(req.requestId ?? '', user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async patchMe(
    @Req() req: Request,
    @Body(new ZodValidationPipe(mePatchBodySchema)) body: unknown,
  ) {
    const parsed = mePatchBodySchema.parse(body);
    const user = await this.auth.patchMe(req.userId!, parsed.locale);
    return successResponse(req.requestId ?? '', user);
  }
}

@Controller()
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Post('users/me/roles')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async assignRole(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(assignRoleBodySchema)) body: unknown,
  ) {
    const parsed = assignRoleBodySchema.parse(body);
    const result = await this.auth.assignRole(
      req.userId!,
      req.sessionId!,
      parsed,
    );
    return successResponse(req.requestId ?? '', {
      user: result.user,
      contexts: result.contexts,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
}
