import { Module } from '@nestjs/common';

import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  providers: [SubscriptionsService, LegalAuditLogger],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
