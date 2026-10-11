import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  employerCreateBodySchema,
  employerPatchBodySchema,
} from '@parton/api-contracts';
import type { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { newCsrfToken } from '../auth/auth.crypto.js';
import { setAuthCookies } from '../auth/auth.cookies.js';
import { ApiException } from '../common/api.exception.js';
import { ErrorCode } from '@parton/api-contracts';
import { AppConfigService } from '../config/app-config.service.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { EmployersService } from './employers.service.js';

@Controller('employers')
export class EmployersController {
  constructor(
    private readonly employers: EmployersService,
    private readonly config: AppConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(employerCreateBodySchema)) body: unknown,
  ) {
    const parsed = employerCreateBodySchema.parse(body);
    const result = await this.employers.createEmployer(
      req.userId!,
      req.sessionId!,
      parsed,
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
      employer: result.employer,
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  @Get('me')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async me(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    const data = await this.employers.getEmployerForUser(
      req.userId!,
      employerId,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('me')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer')
  async patchMe(
    @Req() req: Request,
    @Body(new ZodValidationPipe(employerPatchBodySchema)) body: unknown,
  ) {
    const parsed = employerPatchBodySchema.parse(body);
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İşveren bağlamı gerekli.',
      );
    }
    const data = await this.employers.patchEmployer(
      req.userId!,
      employerId,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('me/setup-status')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async setupStatus(@Req() req: Request) {
    const data = await this.employers.getSetupStatus(
      req.userId!,
      req.authContext?.employerId,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
