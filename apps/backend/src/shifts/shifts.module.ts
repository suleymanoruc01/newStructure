import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { LocationModule } from '../location/location.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RatingsModule } from '../ratings/ratings.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { ShiftSchedulerService } from './shift-scheduler.service.js';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsService } from './shifts.service.js';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    TokensModule,
    LocationModule,
    RatingsModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftSchedulerService, RoleContextGuard],
  exports: [ShiftsService],
})
export class ShiftsModule {}
