import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { managerJoinBodySchema } from '@parton/api-contracts';
import type { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { newCsrfToken } from '../auth/auth.crypto.js';
import { setAuthCookies } from '../auth/auth.cookies.js';
import { AppConfigService } from '../config/app-config.service.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { BranchesService } from './branches.service.js';

@Controller('branches')
export class BranchesJoinController {
  constructor(
    private readonly branches: BranchesService,
    private readonly config: AppConfigService,
  ) {}

  @Post('manager-join')
  @UseGuards(JwtAuthGuard)
  async managerJoin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(managerJoinBodySchema)) body: unknown,
  ) {
    const parsed = managerJoinBodySchema.parse(body);
    const result = await this.branches.managerJoin(
      req.userId!,
      req.sessionId!,
      parsed.code,
    );
    const expiresAt = new Date(
      Date.now() +
        this.config.env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    setAuthCookies(
      res,
      this.config,
      result.refreshToken,
      expiresAt,
      newCsrfToken(),
    );
    return successResponse(req.requestId ?? '', {
      branch: result.branch,
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }
}
