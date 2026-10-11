import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AppConfigService } from '../config/app-config.service.js';
import type { AuthContext } from '@parton/api-contracts';

import type { JwtPayload } from './auth.types.js';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccess(
    userId: string,
    sessionId: string,
    ctx: AuthContext,
  ): { accessToken: string; accessExpiresAt: string } {
    const payload: JwtPayload = {
      sub: userId,
      sid: sessionId,
      ctx,
      ver: 1,
    };
    const ttl = this.config.env.JWT_ACCESS_TTL_SECONDS;
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.env.JWT_ACCESS_SECRET,
      expiresIn: ttl,
    });
    const accessExpiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    return { accessToken, accessExpiresAt };
  }

  verifyAccess(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.config.env.JWT_ACCESS_SECRET,
    });
  }
}
