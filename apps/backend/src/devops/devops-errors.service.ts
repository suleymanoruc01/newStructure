import { createHash } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  DevopsErrorIngestBody,
  DevopsErrorPatchBody,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  fingerprintFor,
  redactDevopsMessage,
  redactDevopsStack,
} from './devops-redaction.js';

@Injectable()
export class DevopsErrorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async captureServerError(params: {
    app: 'api';
    message: string;
    stack?: string;
    requestId?: string;
  }): Promise<void> {
    await this.ingest({
      app: params.app,
      release: this.config.env.PARTON_RELEASE,
      message: params.message,
      stack: params.stack,
      requestId: params.requestId,
    });
  }

  async ingest(body: DevopsErrorIngestBody): Promise<void> {
    const message = redactDevopsMessage(body.message);
    const stack = redactDevopsStack(body.stack);
    const fingerprint =
      body.fingerprint ??
      createHash('sha256')
        .update(fingerprintFor(body.app, message))
        .digest('hex')
        .slice(0, 32);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.devopsErrorGroup.findUnique({
        where: { fingerprint },
      });
      const group =
        existing ??
        (await tx.devopsErrorGroup.create({
          data: {
            fingerprint,
            app: body.app,
            message,
            status: 'open',
            release: body.release ?? null,
            eventCount: 0,
            firstSeenAt: now,
            lastSeenAt: now,
          },
        }));

      await tx.devopsErrorEvent.create({
        data: {
          groupId: group.id,
          app: body.app,
          release: body.release ?? null,
          platform: body.platform ?? null,
          message,
          stack: stack ?? null,
          requestId: body.requestId ?? null,
          extra: (body.extra ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.devopsErrorGroup.update({
        where: { id: group.id },
        data: {
          lastSeenAt: now,
          eventCount: { increment: 1 },
          release: body.release ?? group.release,
          status: group.status === 'resolved' ? 'open' : group.status,
          resolvedAt: group.status === 'resolved' ? null : group.resolvedAt,
        },
      });
    });
  }

  async list(params: {
    app?: string;
    status?: string;
    release?: string;
    limit?: number;
  }) {
    const limit = Math.min(params.limit ?? 50, 100);
    const rows = await this.prisma.devopsErrorGroup.findMany({
      where: {
        ...(params.app ? { app: params.app } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.release ? { release: params.release } : {}),
      },
      orderBy: { lastSeenAt: 'desc' },
      take: limit,
    });
    return {
      items: rows.map((row) => this.mapGroup(row)),
    };
  }

  async getByFingerprint(fingerprint: string) {
    const group = await this.prisma.devopsErrorGroup.findUnique({
      where: { fingerprint },
    });
    if (!group) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Hata kaydı bulunamadı.',
      );
    }
    const events = await this.prisma.devopsErrorEvent.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return {
      ...this.mapGroup(group),
      recentEvents: events.map((e) => ({
        id: e.id,
        message: e.message,
        requestId: e.requestId,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async patch(
    fingerprint: string,
    body: DevopsErrorPatchBody,
    actorUserId: string,
  ) {
    const group = await this.prisma.devopsErrorGroup.findUnique({
      where: { fingerprint },
    });
    if (!group) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Hata kaydı bulunamadı.',
      );
    }
    const updated = await this.prisma.devopsErrorGroup.update({
      where: { id: group.id },
      data: {
        status: body.status,
        resolvedAt: new Date(),
        resolvedByUserId: actorUserId,
      },
    });
    return this.mapGroup(updated);
  }

  private mapGroup(row: {
    fingerprint: string;
    app: string;
    message: string;
    status: string;
    release: string | null;
    eventCount: number;
    firstSeenAt: Date;
    lastSeenAt: Date;
  }) {
    return {
      fingerprint: row.fingerprint,
      app: row.app as 'api' | 'admin' | 'marketing' | 'mobile',
      message: row.message,
      status: row.status as 'open' | 'resolved' | 'ignored',
      release: row.release,
      eventCount: row.eventCount,
      firstSeenAt: row.firstSeenAt.toISOString(),
      lastSeenAt: row.lastSeenAt.toISOString(),
    };
  }
}
