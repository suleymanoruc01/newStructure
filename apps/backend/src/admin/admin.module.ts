import { Module } from '@nestjs/common';

import { FavoritesModule } from '../favorites/favorites.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { WorkersModule } from '../workers/workers.module.js';
import { AdminGuardsModule } from './admin-guards.module.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { AdminOpsController } from './admin-ops.controller.js';
import { AdminOpsService } from './admin-ops.service.js';

@Module({
  imports: [
    AdminGuardsModule,
    NotificationsModule,
    PlatformModule,
    TokensModule,
    FavoritesModule,
    WorkersModule,
  ],
  controllers: [AdminOpsController],
  providers: [AdminOpsService, LegalAuditLogger],
  exports: [AdminGuardsModule],
})
export class AdminModule {}
