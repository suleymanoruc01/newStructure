import { HttpStatus, Injectable } from '@nestjs/common';
import type { DevopsReleaseRegisterBody } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DevopsReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(app?: string, environment?: string) {
    const rows = await this.prisma.devopsRelease.findMany({
      where: {
        ...(app ? { app } : {}),
        ...(environment ? { environment } : {}),
      },
      orderBy: { builtAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        app: row.app as 'api' | 'admin' | 'marketing' | 'mobile',
        version: row.version,
        gitSha: row.gitSha,
        environment: row.environment,
        builtAt: row.builtAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async register(body: DevopsReleaseRegisterBody) {
    try {
      const row = await this.prisma.devopsRelease.create({
        data: {
          app: body.app,
          version: body.version,
          gitSha: body.gitSha,
          environment: body.environment,
          builtAt: new Date(body.builtAt),
        },
      });
      return {
        id: row.id,
        app: row.app as 'api' | 'admin' | 'marketing' | 'mobile',
        version: row.version,
        gitSha: row.gitSha,
        environment: row.environment,
        builtAt: row.builtAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    } catch {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu sürüm zaten kayıtlı.',
      );
    }
  }
}
