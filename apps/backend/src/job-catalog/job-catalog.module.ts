import { Module } from '@nestjs/common';

import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { JobCatalogController } from './job-catalog.controller.js';
import { JobCatalogService } from './job-catalog.service.js';

@Module({
  controllers: [JobCatalogController],
  providers: [JobCatalogService, LegalAuditLogger],
  exports: [JobCatalogService],
})
export class JobCatalogModule {}
