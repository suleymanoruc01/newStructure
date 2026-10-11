import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ModerationController],
  providers: [ModerationService, RoleContextGuard],
})
export class ModerationModule {}
