import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from './api.exception.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

export const REQUIRED_ROLES_KEY = 'required_roles';

export const RequireRoles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

@Injectable()
export class RoleContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuth: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = await this.jwtAuth.canActivate(context);
    if (!ok) {
      return false;
    }
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const ctxRole = req.authContext?.role;
    if (!ctxRole || !roles.includes(ctxRole)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu işlem için yetkiniz yok.',
      );
    }
    return true;
  }
}
