import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ratingCreateSchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { RatingsService } from './ratings.service.js';

@Controller('ratings')
@UseGuards(RoleContextGuard)
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Get('pending')
  @RequireRoles('worker', 'employer', 'manager')
  async listPending(@Req() req: Request) {
    const data = await this.ratings.listPending(
      req.userId!,
      req.authContext!,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post()
  @RequireRoles('worker', 'employer', 'manager')
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(ratingCreateSchema)) body: unknown,
  ) {
    const parsed = ratingCreateSchema.parse(body);
    const data = await this.ratings.createRating(
      req.userId!,
      req.authContext!,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
