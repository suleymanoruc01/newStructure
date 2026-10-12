import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  supportTicketCreateSchema,
  supportTicketMessageCreateSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { SupportService } from './support.service.js';

@Controller('support')
@UseGuards(RoleContextGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('tickets')
  @RequireRoles('worker', 'employer', 'manager')
  async createTicket(
    @Req() req: Request,
    @Body(new ZodValidationPipe(supportTicketCreateSchema)) body: unknown,
  ) {
    const parsed = supportTicketCreateSchema.parse(body);
    const data = await this.support.createTicket(req.userId!, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('tickets')
  @RequireRoles('worker', 'employer', 'manager')
  async listTickets(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.support.listTicketsForUser(
      req.userId!,
      limit ? Number(limit) : 50,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('tickets/:id')
  @RequireRoles('worker', 'employer', 'manager')
  async getTicket(@Req() req: Request, @Param('id') id: string) {
    const data = await this.support.getTicketForUser(id, req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('tickets/:id/messages')
  @RequireRoles('worker', 'employer', 'manager')
  async addMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(supportTicketMessageCreateSchema)) body: unknown,
  ) {
    const parsed = supportTicketMessageCreateSchema.parse(body);
    const data = await this.support.addUserMessage(id, req.userId!, parsed);
    return successResponse(req.requestId ?? '', data);
  }
}
