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
      await this.ratings.sendDueRatingNotifications();
    } catch (error) {
      this.logger.warn(
        `Rating scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
