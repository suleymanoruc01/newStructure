import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  auditEventsListQuerySchema,
  auditReportCreateSchema,
} from '@parton/api-contracts';
import type { Request, Response } from 'express';
import { createReadStream } from 'node:fs';

import { PlatformAdminGuard } from '../admin/platform-admin.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuditExportService } from './audit-export.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('admin/audit')
@UseGuards(PlatformAdminGuard)
export class AdminAuditController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exports: AuditExportService,
  ) {}

  @Get('events')
  async listEvents(
    @Req() req: Request,
    @Query(new ZodValidationPipe(auditEventsListQuerySchema)) query: unknown,
  ) {
    const parsed = auditEventsListQuerySchema.parse(query);
    const limit = parsed.limit ?? 50;
    const rows = await this.prisma.legalAuditEvent.findMany({
      where: {
        ...(parsed.category ? { category: parsed.category } : {}),
        ...(parsed.actorUserId ? { actorUserId: parsed.actorUserId } : {}),
        ...(parsed.from || parsed.to
          ? {
              createdAt: {
                ...(parsed.from ? { gte: new Date(parsed.from) } : {}),
                ...(parsed.to ? { lte: new Date(parsed.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return successResponse(req.requestId ?? '', {
      items: rows.map((row) => ({
        id: row.id,
        category: row.category,
        action: row.action,
        actorUserId: row.actorUserId,
        actorRole: row.actorRole,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        requestId: row.requestId,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  }

  @Get('events/:id')
  async getEvent(@Req() req: Request, @Param('id') id: string) {
    const row = await this.prisma.legalAuditEvent.findUnique({ where: { id } });
    if (!row) {
      return successResponse(req.requestId ?? '', null);
    }
    return successResponse(req.requestId ?? '', {
      id: row.id,
      category: row.category,
      action: row.action,
      actorUserId: row.actorUserId,
      actorRole: row.actorRole,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      requestId: row.requestId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    });
  }

  @Post('reports')
  async createReport(
    @Req() req: Request,
    @Body(new ZodValidationPipe(auditReportCreateSchema)) body: unknown,
  ) {
    const parsed = auditReportCreateSchema.parse(body);
    const data = await this.exports.createReport(
      req.userId!,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('reports/download/:token')
  async downloadReport(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const file = this.exports.resolveDownload(token);
    if (!file) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rapor bulunamadı.' } });
      return;
    }
    const contentType =
      file.format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    createReadStream(file.path).pipe(res);
  }
}
