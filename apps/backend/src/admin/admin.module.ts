import { Module } from '@nestjs/common';

import { FavoritesModule } from '../favorites/favorites.module.js';
import { PoliciesModule } from '../policies/policies.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { WorkersModule } from '../workers/workers.module.js';
import { AdminGuardsModule } from './admin-guards.module.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { AdminOpsController } from './admin-ops.controller.js';
import { AdminOpsService } from './admin-ops.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { SupportModule } from '../support/support.module.js';
import { JobCatalogModule } from '../job-catalog/job-catalog.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { ApplicationsModule } from '../applications/applications.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';

@Module({
  imports: [
    AdminGuardsModule,
    ApplicationsModule,
    NotificationsModule,
    PlatformModule,
    TokensModule,
    FavoritesModule,
    WorkersModule,
    PoliciesModule,
    SubscriptionsModule,
    SupportModule,
    JobCatalogModule,
    BranchesModule,
    ShiftsModule,
  ],
  controllers: [AdminOpsController],
  providers: [AdminOpsService, LegalAuditLogger],
  exports: [AdminGuardsModule],
})
export class AdminModule {}
