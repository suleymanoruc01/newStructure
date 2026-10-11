import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'Yetkilendirme gerekli.',
      );
    }
    const token = header.slice('Bearer '.length);
    let payload;
    try {
      payload = this.tokens.verifyAccess(token);
    } catch {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'Geçersiz erişim jetonu.',
      );
    }
    await this.sessions.assertSessionActive(payload.sid);
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    req.authContext = payload.ctx;
    return true;
  }
}
