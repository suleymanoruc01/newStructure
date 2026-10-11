import { Module } from '@nestjs/common';

import { AdminGuardsModule } from '../admin/admin-guards.module.js';
import { AdminAuditController } from './admin-audit.controller.js';
import { AuditExportService } from './audit-export.service.js';
import { LegalAuditLogger } from './legal-audit.logger.js';

@Module({
  imports: [AdminGuardsModule],
  controllers: [AdminAuditController],
  providers: [LegalAuditLogger, AuditExportService],
  exports: [LegalAuditLogger],
})
export class AuditModule {}
