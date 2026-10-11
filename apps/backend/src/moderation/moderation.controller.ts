import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { moderationReportCreateSchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ModerationService } from './moderation.service.js';

@Controller('moderation')
@UseGuards(RoleContextGuard)
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post('reports')
  @RequireRoles('worker', 'employer', 'manager')
  async createReport(
    @Req() req: Request,
    @Body(new ZodValidationPipe(moderationReportCreateSchema)) body: unknown,
  ) {
    const parsed = moderationReportCreateSchema.parse(body);
    const data = await this.moderation.createReport(req.userId!, parsed);
    return successResponse(req.requestId ?? '', data);
  }
}
