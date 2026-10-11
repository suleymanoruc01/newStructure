import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { applicationStatusSchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ApplicationsService } from './applications.service.js';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async listMine(
    @Req() req: Request,
    @Query('mine') mine?: string,
    @Query('status') statusRaw?: string,
  ) {
    if (mine !== '1') {
      return successResponse(req.requestId ?? '', { items: [] });
    }
    const status = statusRaw
      ? applicationStatusSchema.parse(statusRaw)
      : undefined;
    const data = await this.applications.listMine(req.userId!, status);
    return successResponse(req.requestId ?? '', data);
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const data = await this.applications.getOne(
      req.userId!,
      req.authContext,
      id,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/withdraw')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async withdraw(@Req() req: Request, @Param('id') id: string) {
    const data = await this.applications.withdraw(req.userId!, id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/accept')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async accept(@Req() req: Request, @Param('id') id: string) {
    const idem = req.headers['idempotency-key'];
    const data = await this.applications.accept(
      req.userId!,
      req.authContext!,
      id,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/reject')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async reject(@Req() req: Request, @Param('id') id: string) {
    const data = await this.applications.reject(
      req.userId!,
      req.authContext!,
      id,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/accept-revoke')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async revokeAccept(@Req() req: Request, @Param('id') id: string) {
    const idem = req.headers['idempotency-key'];
    const data = await this.applications.revokeAccept(
      req.userId!,
      req.authContext!,
      id,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
