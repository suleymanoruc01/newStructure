import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  PoliciesController,
  PolicyCatalogController,
} from './policies.controller.js';
import { PoliciesService } from './policies.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PolicyCatalogController, PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
