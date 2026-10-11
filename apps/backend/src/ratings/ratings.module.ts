import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RatingSchedulerService } from './rating-scheduler.service.js';
import { RatingsController } from './ratings.controller.js';
import { RatingsService } from './ratings.service.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [RatingsController],
  providers: [RatingsService, RatingSchedulerService, RoleContextGuard],
  exports: [RatingsService],
})
export class RatingsModule {}
