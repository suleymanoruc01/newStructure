import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly jwtAuth: JwtAuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.jwtAuth.canActivate(context);
    const req = context.switchToHttp().getRequest<Request>();
    if (req.authContext?.role !== 'admin') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Platform yöneticisi erişimi gerekli.',
      );
    }
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { userId: req.userId! },
    });
    if (!admin) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Platform yöneticisi kaydı bulunamadı.',
      );
    }
    return true;
  }
}
