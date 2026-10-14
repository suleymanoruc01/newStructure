import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  availabilityConfirmBodySchema,
  checkInBodySchema,
  checkOutBodySchema,
  disputeCreateBodySchema,
  disputeRejectBodySchema,
  shiftIncidentCreateBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ShiftsService } from './shifts.service.js';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  @Get()
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async listMine(@Req() req: Request, @Query('mine') mine?: string) {
    if (mine !== '1') {
      return successResponse(req.requestId ?? '', { items: [] });
    }
    const data = await this.shifts.listMine(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('employer/open-disputes')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async employerOpenDisputes(@Req() req: Request) {
    const data = await this.shifts.listEmployerOpenDisputes(req.authContext!);
    return successResponse(req.requestId ?? '', data);
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const data = await this.shifts.getForUser(req.userId!, req.authContext, id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/availability-confirm')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async availabilityConfirm(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(availabilityConfirmBodySchema)) body: unknown,
  ) {
    const parsed = availabilityConfirmBodySchema.parse(body);
    const data = await this.shifts.availabilityConfirm(
      req.userId!,
      id,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/check-in')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async checkIn(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(checkInBodySchema)) body: unknown,
  ) {
    const parsed = checkInBodySchema.parse(body);
    const idem = req.headers['idempotency-key'];
    const data = await this.shifts.checkIn(
      req.userId!,
      id,
      parsed,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/check-out')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async checkOut(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(checkOutBodySchema)) body: unknown,
  ) {
    const parsed = checkOutBodySchema.parse(body);
    const data = await this.shifts.checkOut(req.userId!, id, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/incidents')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async incident(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(shiftIncidentCreateBodySchema)) body: unknown,
  ) {
    const parsed = shiftIncidentCreateBodySchema.parse(body);
    const data = await this.shifts.createIncident(req.userId!, id, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/disputes')
  @UseGuards(RoleContextGuard)
  @RequireRoles('worker')
  async dispute(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(disputeCreateBodySchema)) body: unknown,
  ) {
    const parsed = disputeCreateBodySchema.parse(body);
    const data = await this.shifts.createDispute(req.userId!, id, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/disputes/:disputeId/reject')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async rejectDispute(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('disputeId') disputeId: string,
    @Body(new ZodValidationPipe(disputeRejectBodySchema)) body: unknown,
  ) {
    const parsed = disputeRejectBodySchema.parse(body);
    const data = await this.shifts.rejectDispute(
      req.userId!,
      req.authContext!,
      id,
      disputeId,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/manual-confirm')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async manualConfirm(@Req() req: Request, @Param('id') id: string) {
    const idem = req.headers['idempotency-key'];
    const data = await this.shifts.manualConfirm(
      req.userId!,
      req.authContext!,
      id,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
