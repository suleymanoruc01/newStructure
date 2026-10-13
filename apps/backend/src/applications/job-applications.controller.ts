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
  applicationApplyBodySchema,
  applicationStatusSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ApplicationsService } from './applications.service.js';

@Controller('jobs/:jobId/applications')
export class JobApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleContextGuard)
  @RequireRoles('worker')
  async apply(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body(new ZodValidationPipe(applicationApplyBodySchema)) body: unknown,
  ) {
    const parsed = applicationApplyBodySchema.parse(body);
    const idem = req.headers['idempotency-key'];
    const data = await this.applications.applyToJob(
      req.userId!,
      jobId,
      parsed,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async list(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Query('status') statusRaw?: string,
  ) {
    const status = statusRaw
      ? applicationStatusSchema.parse(statusRaw)
      : undefined;
    const data = await this.applications.listForJob(
      req.userId!,
      req.authContext!,
      jobId,
      status,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
