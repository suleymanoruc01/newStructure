import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service.js';
import { RatingsService } from './ratings.service.js';

@Injectable()
export class RatingSchedulerService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(RatingSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private stopped = false;
  private inflight: Promise<void> | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly ratings: RatingsService,
  ) {}

  onModuleInit(): void {
    const interval = this.config.env.RATING_SCHEDULER_INTERVAL_MS;
    this.timer = setInterval(() => {
      void this.tick();
    }, interval);
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    this.stop();
    if (this.inflight) {
      await this.inflight;
    }
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    this.stop();
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick(): Promise<void> {
    if (this.running || this.stopped) {
      return;
    }
    this.running = true;
    const run = this.runTick();
    this.inflight = run;
    try {
      await run;
    } finally {
      this.running = false;
      if (this.inflight === run) {
        this.inflight = null;
      }
    }
  }

  private async runTick(): Promise<void> {
    try {
      await this.ratings.sendDueRatingNotifications();
    } catch (error) {
      this.logger.warn(
        `Rating scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
