import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  NotificationPreferences,
  NotificationPreferencesPatch,
  PushTokenRegisterBody,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';
import type { Prisma } from '../generated/prisma/client.js';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type NotificationTemplateInput,
  renderNotification,
} from './notification-templates.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerPushToken(userId: string, body: PushTokenRegisterBody) {
    const now = new Date();
    await this.prisma.devicePushToken.upsert({
      where: { token: body.token },
      create: {
        userId,
        token: body.token,
        platform: body.platform,
        deviceId: body.deviceId,
        appVersion: body.appVersion,
        lastSeenAt: now,
      },
      update: {
        userId,
        platform: body.platform,
        deviceId: body.deviceId,
        appVersion: body.appVersion,
        lastSeenAt: now,
        disabledAt: null,
      },
    });
  }

  async deleteCurrentDeviceToken(userId: string, token: string) {
    await this.prisma.devicePushToken.deleteMany({
      where: { userId, token },
    });
  }

  async listInbox(userId: string, limit = 50) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      items: rows.map((row) => this.mapNotification(row)),
    };
  }

  async getOne(userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Bildirim bulunamadı.',
      );
    }
    return this.mapNotification(row);
  }

  async markRead(userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Bildirim bulunamadı.',
      );
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.mapNotification(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const row = await this.ensurePrefs(userId);
    return this.mapPrefs(row);
  }

  async patchPreferences(
    userId: string,
    patch: NotificationPreferencesPatch,
  ): Promise<NotificationPreferences> {
    await this.ensurePrefs(userId);
    const updated = await this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        shifts: patch.shifts,
        applications: patch.applications,
        matching: patch.matching,
        favorites: patch.favorites,
        marketing: patch.marketing,
      },
    });
    return this.mapPrefs(updated);
  }

  async enqueueInTransaction(
    tx: Tx,
    params: {
      userId: string;
      type: string;
      dedupeKey: string;
      templateInput: NotificationTemplateInput;
      data: Record<string, string>;
    },
  ): Promise<string> {
    let locale = params.templateInput.locale;
    if (!locale) {
      const user = await tx.user.findUnique({
        where: { id: params.userId },
        select: { locale: true },
      });
      locale = user?.locale?.startsWith('en') ? 'en' : 'tr';
    }
    const rendered = renderNotification(params.type, {
      ...params.templateInput,
      locale,
    });
    const existing = await tx.notification.findUnique({
      where: {
        userId_dedupeKey: {
          userId: params.userId,
          dedupeKey: params.dedupeKey,
        },
      },
    });
    if (existing) {
      return existing.id;
    }
    const notification = await tx.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: rendered.title,
        body: rendered.body,
        data: params.data,
        dedupeKey: params.dedupeKey,
      },
    });
    await tx.outboxEvent.create({
      data: {
        type: 'notification.dispatch',
        payload: { notificationId: notification.id },
      },
    });
    return notification.id;
  }

  private async ensurePrefs(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private mapNotification(row: {
    id: string;
    type: string;
    title: string;
    body: string;
    data: unknown;
    readAt: Date | null;
    createdAt: Date;
  }) {
    const data =
      row.data && typeof row.data === 'object'
        ? Object.fromEntries(
            Object.entries(row.data as Record<string, unknown>).map(
              ([k, v]) => [k, String(v)],
            ),
          )
        : {};
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      data,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapPrefs(row: {
    shifts: boolean;
    applications: boolean;
    matching: boolean;
    favorites: boolean;
    marketing: boolean;
  }): NotificationPreferences {
    return {
      shifts: row.shifts,
      applications: row.applications,
      matching: row.matching,
      favorites: row.favorites,
      marketing: row.marketing,
    };
  }
}
