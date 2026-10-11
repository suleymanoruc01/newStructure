import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/app-config.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { TokensController } from './tokens.controller.js';
import { TokensService } from './tokens.service.js';
import { TopUpProvider } from './top-up.provider.js';

@Module({
  imports: [AuthModule, AppConfigModule],
  controllers: [TokensController],
  providers: [TokensService, TopUpProvider, RoleContextGuard],
  exports: [TokensService],
})
export class TokensModule {}
