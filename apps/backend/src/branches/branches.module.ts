import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { BranchesJoinController } from './branches-join.controller.js';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BranchesController, BranchesJoinController],
  providers: [BranchesService, RoleContextGuard],
  exports: [BranchesService],
})
export class BranchesModule {}
