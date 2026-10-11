import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildFcmMessage, categoryForType } from './fcm-message.js';
import { FirebaseAdminProvider } from './firebase-admin.provider.js';

@Injectable()
export class FcmDispatcherService {
  private readonly logger = new Logger(FcmDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseAdminProvider,
  ) {}

  async dispatchNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      return;
    }
    if (notification.type === 'job.audience_empty') {
      return;
    }

    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId: notification.userId },
    });
    const category = categoryForType(notification.type);
    if (prefs) {
      if (category === 'applications' && !prefs.applications) {
        return;
      }
      if (category === 'shifts' && !prefs.shifts) {
        return;
      }
      if (category === 'matching' && !prefs.matching) {
        return;
      }
      if (category === 'favorites' && !prefs.favorites) {
        return;
      }
      if (category === 'marketing' && !prefs.marketing) {
        return;
      }
    }

    const tokens = await this.prisma.devicePushToken.findMany({
      where: {
        userId: notification.userId,
        disabledAt: null,
      },
    });
    if (tokens.length === 0) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { deliveryAttempts: { increment: 1 } },
      });
      return;
    }

    const data = this.stringifyData(notification.data);
    data.notificationId = notification.id;
    data.type = notification.type;
    data.v = '1';

    const fcm = this.firebase.messaging();
    for (const device of tokens) {
      const message = buildFcmMessage({
        token: device.token,
        title: notification.title,
        body: notification.body,
        data,
        type: notification.type,
        notificationId: notification.id,
      });
      try {
        const messageId = await fcm.send(message);
        await this.prisma.$transaction([
          this.prisma.notification.update({
            where: { id: notificationId },
            data: {
              deliveryAttempts: { increment: 1 },
              fcmMessageId: messageId,
            },
          }),
          this.prisma.devicePushToken.update({
            where: { id: device.id },
            data: { lastSeenAt: new Date() },
          }),
        ]);
      } catch (error) {
        const code = this.extractErrorCode(error);
        this.logger.warn(
          `FCM send failed for notification ${notificationId}: ${code}`,
        );
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { deliveryAttempts: { increment: 1 } },
        });
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          await this.prisma.devicePushToken.update({
            where: { id: device.id },
            data: { disabledAt: new Date() },
          });
        }
      }
    }
  }

  private stringifyData(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object') {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (raw === undefined || raw === null) {
        continue;
      }
      out[key] = String(raw);
    }
    return out;
  }

  private extractErrorCode(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as { code: unknown }).code);
    }
    return 'unknown';
  }
}
