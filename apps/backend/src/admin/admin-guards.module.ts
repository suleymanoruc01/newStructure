import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AdminMcpGuard } from './admin-mcp.guard.js';
import { PlatformAdminGuard } from './platform-admin.guard.js';

@Module({
  imports: [AuthModule],
  providers: [PlatformAdminGuard, AdminMcpGuard],
  exports: [PlatformAdminGuard, AdminMcpGuard, AuthModule],
})
export class AdminGuardsModule {}
