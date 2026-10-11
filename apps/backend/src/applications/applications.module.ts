import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { FavoritesModule } from '../favorites/favorites.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { WorkersModule } from '../workers/workers.module.js';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { JobApplicationsController } from './job-applications.controller.js';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    ShiftsModule,
    TokensModule,
    FavoritesModule,
    WorkersModule,
  ],
  controllers: [ApplicationsController, JobApplicationsController],
  providers: [ApplicationsService, RoleContextGuard],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
