import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { AppConfigService } from '../config/app-config.service.js';
import { PlatformAdminGuard } from './platform-admin.guard.js';

@Injectable()
export class AdminMcpGuard implements CanActivate {
  constructor(
    private readonly config: AppConfigService,
    private readonly platformAdmin: PlatformAdminGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const mcpKey = req.headers['x-parton-mcp-api-key'];
    const expected = this.config.env.PARTON_MCP_API_KEY;
    if (
      typeof mcpKey === 'string' &&
      expected &&
      mcpKey.length > 0 &&
      mcpKey === expected
    ) {
      return true;
    }
    return this.platformAdmin.canActivate(context);
  }
}
