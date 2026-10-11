import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FcmDispatcherService } from './fcm-dispatcher.service.js';

@Injectable()
export class OutboxDrainService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(OutboxDrainService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private draining = false;
  private stopped = false;
  private inflight: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmDispatcherService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit(): void {
    const interval = this.config.env.OUTBOX_DRAIN_INTERVAL_MS;
    this.timer = setInterval(() => {
      void this.drainOnce();
    }, interval);
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    this.stopDrain();
    if (this.inflight) {
      await this.inflight;
    }
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    this.stopDrain();
  }

  private stopDrain(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async drainOnce(): Promise<void> {
    if (this.draining || this.stopped) {
      return;
    }
    this.draining = true;
    const run = this.drainPending();
    this.inflight = run;
    try {
      await run;
    } finally {
      this.draining = false;
      if (this.inflight === run) {
        this.inflight = null;
      }
    }
  }

  private async drainPending(): Promise<void> {
    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: {
          status: 'pending',
          availableAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      for (const event of events) {
        if (this.stopped) {
          return;
        }
        await this.processEvent(event.id);
      }
    } catch (error) {
      this.logger.warn(
        `Outbox drain failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async processEvent(eventId: string): Promise<void> {
    const event = await this.prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });
    if (!event || event.status !== 'pending') {
      return;
    }
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: { status: 'processing', attempts: { increment: 1 } },
    });
    try {
      if (event.type === 'notification.dispatch') {
        const payload = event.payload as { notificationId?: string };
        if (!payload.notificationId) {
          throw new Error('notificationId missing in outbox payload');
        }
        await this.fcm.dispatchNotification(payload.notificationId);
      }
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'completed', processedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = event.attempts + 1;
      const backoffMs = Math.min(60_000, 1000 * 2 ** attempts);
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: attempts >= 8 ? 'failed' : 'pending',
          lastError: message.slice(0, 2000),
          availableAt: new Date(Date.now() + backoffMs),
        },
      });
      this.logger.warn(`Outbox event ${eventId} failed: ${message}`);
    }
  }
}
