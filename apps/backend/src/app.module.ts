import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { RequestIdMiddleware } from './common/request-id.middleware.js';
import { HealthModule } from './health/health.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { EmployersModule } from './employers/employers.module.js';
import { PoliciesModule } from './policies/policies.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { JobCatalogModule } from './job-catalog/job-catalog.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ShiftsModule } from './shifts/shifts.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuditModule } from './audit/audit.module.js';
import { DevopsModule } from './devops/devops.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { RatingsModule } from './ratings/ratings.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { StorageModule } from './storage/storage.module.js';
import { TokensModule } from './tokens/tokens.module.js';
import { WorkersModule } from './workers/workers.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { BullmqModule } from './queue/bullmq.module.js';
import { SupportModule } from './support/support.module.js';

@Module({
  imports: [
    AppConfigModule,
    BullmqModule.register(
      process.env.BULLMQ_ENABLED === 'true',
      process.env.REDIS_QUEUE_URL,
    ),
    StorageModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    PoliciesModule,
    WorkersModule,
    EmployersModule,
    BranchesModule,
    TokensModule,
    JobCatalogModule,
    JobsModule,
    ApplicationsModule,
    NotificationsModule,
    ShiftsModule,
    FavoritesModule,
    RatingsModule,
    ModerationModule,
    SupportModule,
    AdminModule,
    AuditModule,
    DevopsModule,
    PlatformModule,
    RealtimeModule,
  ],
  providers: [ApiExceptionFilter],
  exports: [ApiExceptionFilter],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
