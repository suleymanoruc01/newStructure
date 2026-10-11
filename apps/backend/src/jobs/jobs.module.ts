import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { FavoritesModule } from '../favorites/favorites.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { WorkersModule } from '../workers/workers.module.js';
import { BranchJobsController } from './branch-jobs.controller.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [
    AuthModule,
    TokensModule,
    FavoritesModule,
    WorkersModule,
    NotificationsModule,
    PlatformModule,
  ],
  controllers: [JobsController, BranchJobsController],
  providers: [JobsService, RoleContextGuard],
  exports: [JobsService],
})
export class JobsModule {}
