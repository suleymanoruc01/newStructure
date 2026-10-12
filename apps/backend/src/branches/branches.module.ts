import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { BranchesJoinController } from './branches-join.controller.js';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [BranchesController, BranchesJoinController],
  providers: [BranchesService, RoleContextGuard, LegalAuditLogger],
  exports: [BranchesService],
})
export class BranchesModule {}
