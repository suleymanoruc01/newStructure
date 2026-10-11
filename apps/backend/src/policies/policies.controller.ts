import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { policyAcceptanceBodySchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PoliciesService } from './policies.service.js';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: Request) {
    const data = await this.policies.listPendingPolicies(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('acceptances')
  @UseGuards(JwtAuthGuard)
  async accept(
    @Req() req: Request,
    @Body(new ZodValidationPipe(policyAcceptanceBodySchema)) body: unknown,
  ) {
    const parsed = policyAcceptanceBodySchema.parse(body);
    const data = await this.policies.acceptPolicies(
      req.userId!,
      parsed.policyIds,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
