import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { successResponse } from '../common/response.util.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live(@Req() req: Request) {
    const requestId = req.requestId ?? '';
    return successResponse(requestId, { status: 'ok' as const });
  }

  @Get('ready')
  async ready(@Req() req: Request) {
    const requestId = req.requestId ?? '';
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }
    const status = database === 'up' ? 'ok' : 'degraded';
    return successResponse(requestId, { status, database });
  }
}
