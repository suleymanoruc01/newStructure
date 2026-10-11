import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const refreshCookie = req.cookies?.[this.config.env.REFRESH_COOKIE_NAME];
    if (!refreshCookie) {
      return true;
    }
    const csrfCookie = req.cookies?.[this.config.env.CSRF_COOKIE_NAME];
    const header = req.headers['x-csrf-token'];
    if (
      !csrfCookie ||
      typeof header !== 'string' ||
      header !== csrfCookie
    ) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'CSRF doğrulaması başarısız.',
      );
    }
    return true;
  }
}
