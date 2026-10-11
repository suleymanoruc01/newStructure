import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  branchCreateBodySchema,
  branchPatchBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { BranchesService } from './branches.service.js';

@Controller('branches')
@UseGuards(RoleContextGuard)
@RequireRoles('employer', 'manager')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  async list(@Req() req: Request) {
    const data = await this.branches.listBranches(
      req.userId!,
      req.authContext!,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post()
  @RequireRoles('employer')
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(branchCreateBodySchema)) body: unknown,
  ) {
    const parsed = branchCreateBodySchema.parse(body);
    const data = await this.branches.createBranch(
      req.userId!,
      req.authContext!,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const data = await this.branches.getBranch(
      req.userId!,
      req.authContext!,
      id,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch(':id')
  @RequireRoles('employer')
  async patch(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(branchPatchBodySchema)) body: unknown,
  ) {
    const parsed = branchPatchBodySchema.parse(body);
    const data = await this.branches.patchBranch(
      req.userId!,
      req.authContext!,
      id,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
