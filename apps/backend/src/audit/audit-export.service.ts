import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { AuditReportCreateBody } from '@parton/api-contracts';

import { PrismaService } from '../prisma/prisma.service.js';
import { LegalAuditLogger } from './legal-audit.logger.js';

const REPORT_TTL_MS = 15 * 60 * 1000;

type StoredReport = {
  path: string;
  format: 'csv' | 'pdf';
  expiresAt: number;
};

@Injectable()
export class AuditExportService {
  private readonly reports = new Map<string, StoredReport>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LegalAuditLogger,
  ) {
    const dir = join(process.cwd(), '.audit-reports');
    mkdirSync(dir, { recursive: true });
  }

  async createReport(
    actorUserId: string,
    body: AuditReportCreateBody,
    requestId: string,
  ) {
    const from = new Date(body.from);
    const to = new Date(body.to);
    const rows = await this.prisma.legalAuditEvent.findMany({
      where: {
        category: { in: body.categories },
        createdAt: { gte: from, lte: to },
        ...(body.actorUserId ? { actorUserId: body.actorUserId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 10_000,
    });

    const reportId = randomUUID();
    const dir = join(process.cwd(), '.audit-reports');
    const filePath = join(dir, `${reportId}.${body.format}`);

    if (body.format === 'csv') {
      const header =
        'id,category,action,actor_user_id,actor_role,resource_type,resource_id,request_id,created_at\n';
      const lines = rows.map((row) =>
        [
          row.id,
          row.category,
          row.action,
          row.actorUserId ?? '',
          row.actorRole ?? '',
          row.resourceType ?? '',
          row.resourceId ?? '',
          row.requestId ?? '',
          row.createdAt.toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      writeFileSync(filePath, header + lines.join('\n'), 'utf8');
    } else {
      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 48 });
        const stream = doc.pipe(createWriteStream(filePath));
        doc.fontSize(16).text('PartOn Legal Audit Report', { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(`From: ${from.toISOString()}`);
        doc.text(`To: ${to.toISOString()}`);
        doc.text(`Categories: ${body.categories.join(', ')}`);
        doc.text(`Generated: ${new Date().toISOString()}`);
        doc.moveDown();
        for (const row of rows) {
          doc.text(
            `${row.createdAt.toISOString()} | ${row.category} | ${row.action} | actor=${row.actorUserId ?? '-'} | resource=${row.resourceType ?? '-'}:${row.resourceId ?? '-'}`,
          );
        }
        doc.end();
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });
    }

    const downloadToken = createHash('sha256')
      .update(`${reportId}:${Date.now()}`)
      .digest('hex');
    const expiresAt = Date.now() + REPORT_TTL_MS;
    this.reports.set(downloadToken, {
      path: filePath,
      format: body.format,
      expiresAt,
    });

    await this.audit.append({
      category: 'audit_export',
      action: 'audit.report_generated',
      actorUserId,
      actorRole: 'admin',
      requestId,
      metadata: {
        reportId,
        format: body.format,
        from: body.from,
        to: body.to,
        categories: body.categories,
      },
    });

    return {
      reportId,
      format: body.format,
      downloadToken,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  resolveDownload(token: string): { path: string; format: 'csv' | 'pdf' } | null {
    const row = this.reports.get(token);
    if (!row || row.expiresAt < Date.now()) {
      this.reports.delete(token);
      return null;
    }
    return { path: row.path, format: row.format };
  }
}
