import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { SupportController } from './support.controller.js';
import { SupportService } from './support.service.js';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [SupportController],
  providers: [SupportService, LegalAuditLogger, RoleContextGuard],
  exports: [SupportService],
})
export class SupportModule {}
