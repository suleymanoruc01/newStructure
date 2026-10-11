import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  jobCreateBodySchema,
  jobPatchBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import {
  successPaginatedResponse,
  successResponse,
} from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JobsService } from './jobs.service.js';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard, RoleContextGuard)
  @RequireRoles('worker')
  async feed(
    @Req() req: Request,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;
    const result = await this.jobs.workerFeed(req.userId!, limit, cursor);
    const { nextCursor, limit: pageLimit, items } = result;
    return successPaginatedResponse(
      req.requestId ?? '',
      { items },
      {
        nextCursor,
        limit: pageLimit,
      },
    );
  }

  @Get()
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async list(@Req() req: Request, @Query('employer') employer?: string) {
    if (employer !== 'me') {
      return successResponse(req.requestId ?? '', { items: [] });
    }
    const data = await this.jobs.listEmployerJobs(req.authContext!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post()
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(jobCreateBodySchema)) body: unknown,
  ) {
    const parsed = jobCreateBodySchema.parse(body);
    const idem = req.headers['idempotency-key'];
    const data = await this.jobs.createJob(
      req.userId!,
      req.authContext!,
      parsed,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const data = await this.jobs.getJobForUser(
      req.userId!,
      req.authContext,
      id,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch(':id')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async patch(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(jobPatchBodySchema)) body: unknown,
  ) {
    const parsed = jobPatchBodySchema.parse(body);
    const idem = req.headers['idempotency-key'];
    const data = await this.jobs.patchJob(
      req.authContext!,
      id,
      parsed,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
