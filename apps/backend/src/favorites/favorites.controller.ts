import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { favoriteCreateSchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { FavoritesService } from './favorites.service.js';

@Controller('favorites')
@UseGuards(RoleContextGuard)
@RequireRoles('worker', 'employer', 'manager')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  async list(@Req() req: Request) {
    const data = await this.favorites.list(req.userId!, req.authContext!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(favoriteCreateSchema)) body: unknown,
  ) {
    const parsed = favoriteCreateSchema.parse(body);
    const data = await this.favorites.create(
      req.userId!,
      req.authContext!,
      parsed,
      idempotencyKey,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    await this.favorites.remove(req.userId!, id);
    return successResponse(req.requestId ?? '', { deleted: true });
  }
}
