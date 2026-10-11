import { HttpStatus, Injectable } from '@nestjs/common';
import type { ModerationReportCreate } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterUserId: string, body: ModerationReportCreate) {
    if (body.targetUserId) {
      const target = await this.prisma.user.findUnique({
        where: { id: body.targetUserId },
        select: { id: true },
      });
      if (!target) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'Şikayet edilen kullanıcı bulunamadı.',
        );
      }
    }

    const row = await this.prisma.abuseReport.create({
      data: {
        reporterUserId,
        targetUserId: body.targetUserId,
        category: body.category,
        note: body.note,
        status: 'open',
      },
    });

    return {
      id: row.id,
      category: body.category,
      note: row.note,
      status: 'open' as const,
      reporterUserId,
      targetUserId: row.targetUserId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
