import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  branchJobCreateBodySchema,
  jobCreateBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JobsService } from './jobs.service.js';

@Controller('branches')
@UseGuards(RoleContextGuard)
@RequireRoles('employer', 'manager')
export class BranchJobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post(':branchId/jobs')
  async createForBranch(
    @Req() req: Request,
    @Param('branchId') branchId: string,
    @Body(new ZodValidationPipe(branchJobCreateBodySchema)) body: unknown,
  ) {
    const parsed = branchJobCreateBodySchema.parse(body);
    const merged = jobCreateBodySchema.parse({
      ...parsed,
      branchId,
    });
    const idem = req.headers['idempotency-key'];
    const data = await this.jobs.createJob(
      req.userId!,
      req.authContext!,
      merged,
      typeof idem === 'string' ? idem : undefined,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
