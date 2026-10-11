import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  policyAcceptanceBodySchema,
  policyReadBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PoliciesService } from './policies.service.js';

@Controller('policies')
export class PolicyCatalogController {
  constructor(private readonly policies: PoliciesService) {}

  @Get('catalog')
  async catalog(@Req() req: Request) {
    const data = await this.policies.listPublished();
    return successResponse(req.requestId ?? '', data);
  }
}

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  async list(@Req() req: Request) {
    const data = await this.policies.listPendingPolicies(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('reads')
  async read(
    @Req() req: Request,
    @Body(new ZodValidationPipe(policyReadBodySchema)) body: unknown,
  ) {
    const parsed = policyReadBodySchema.parse(body);
    const data = await this.policies.recordRead(
      req.userId!,
      parsed.policyId,
      parsed.version,
      req.authContext?.role ?? null,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('acceptances')
  async accept(
    @Req() req: Request,
    @Body(new ZodValidationPipe(policyAcceptanceBodySchema)) body: unknown,
  ) {
    const parsed = policyAcceptanceBodySchema.parse(body);
    const data = await this.policies.acceptPolicy(
      req.userId!,
      parsed.policyId,
      parsed.version,
      req.authContext?.role ?? null,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }
}
