import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/app-config.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { TokenPackagesService } from './token-packages.service.js';
import { TokensController } from './tokens.controller.js';
import { TokensService } from './tokens.service.js';
import { TopUpProvider } from './top-up.provider.js';

@Module({
  imports: [AuthModule, AppConfigModule, SubscriptionsModule],
  controllers: [TokensController],
  providers: [
    TokensService,
    TokenPackagesService,
    TopUpProvider,
    RoleContextGuard,
    LegalAuditLogger,
  ],
  exports: [TokensService, TokenPackagesService],
})
export class TokensModule {}
