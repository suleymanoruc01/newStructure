import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShiftsService } from './shifts.service.js';

@Injectable()
export class ShiftSchedulerService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(ShiftSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
    private readonly shifts: ShiftsService,
  ) {}

  onModuleInit(): void {
    const interval = this.config.env.SHIFT_SCHEDULER_INTERVAL_MS;
    this.timer = setInterval(() => {
      void this.tick();
    }, interval);
  }

  onModuleDestroy(): void {
    this.stop();
  }

  onApplicationShutdown(): void {
    this.stop();
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.sendConfirm3hNotifications();
      await this.processConfirmTimeouts();
      await this.sendCheckinDueNotifications();
    } catch (error) {
      this.logger.warn(
        `Shift scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }

  async sendConfirm3hNotifications(): Promise<void> {
    const now = new Date();
    const rows = await this.prisma.shift.findMany({
      where: {
        confirm3hNotifiedAt: null,
        confirmOpensAt: { lte: now },
        status: { in: ['scheduled', 'awaiting_confirm'] },
      },
      take: 50,
      include: { job: true },
    });
    for (const shift of rows) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.shift.findUnique({ where: { id: shift.id } });
        if (!current || current.confirm3hNotifiedAt) {
          return;
        }
        await tx.shift.update({
          where: { id: shift.id },
          data: {
            confirm3hNotifiedAt: now,
            status: 'awaiting_confirm',
          },
        });
        const startLocal = shift.startsAt.toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
        });
        await this.notifications.enqueueInTransaction(tx, {
          userId: shift.workerUserId,
          type: 'shift.confirm_3h',
          dedupeKey: `shift.confirm_3h:${shift.id}`,
          templateInput: {
            jobTitle: shift.job.title ?? shift.job.sectorCode,
            startLocal,
          },
          data: { shiftId: shift.id, jobId: shift.jobId },
        });
      });
    }
  }

  async processConfirmTimeouts(): Promise<void> {
    const now = new Date();
    const rows = await this.prisma.shift.findMany({
      where: {
        availabilityDecision: null,
        confirmDeadlineAt: { lte: now },
        status: { in: ['scheduled', 'awaiting_confirm'] },
      },
      take: 50,
    });
    for (const shift of rows) {
      await this.shifts.processNoResponseRelease(shift.id);
    }
  }

  async sendCheckinDueNotifications(): Promise<void> {
    const now = new Date();
    const dueMs = this.config.env.CHECKIN_DUE_MINUTES * 60 * 1000;
    const windowEnd = new Date(now.getTime() + dueMs);
    const rows = await this.prisma.shift.findMany({
      where: {
        status: 'can_come',
        checkinDueNotifiedAt: null,
        startsAt: { lte: windowEnd, gte: now },
      },
      take: 50,
      include: { job: true },
    });
    for (const shift of rows) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.shift.findUnique({ where: { id: shift.id } });
        if (!current || current.checkinDueNotifiedAt) {
          return;
        }
        await tx.shift.update({
          where: { id: shift.id },
          data: { checkinDueNotifiedAt: now },
        });
        await this.notifications.enqueueInTransaction(tx, {
          userId: shift.workerUserId,
          type: 'shift.checkin_due',
          dedupeKey: `shift.checkin_due:${shift.id}`,
          templateInput: {
            jobTitle: shift.job.title ?? shift.job.sectorCode,
          },
          data: { shiftId: shift.id, jobId: shift.jobId },
        });
      });
    }
  }
}
