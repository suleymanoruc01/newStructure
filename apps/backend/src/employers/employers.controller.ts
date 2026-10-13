import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  employerCreateBodySchema,
  employerPatchBodySchema,
  managerAssignmentPatchBodySchema,
  managerInvitePatchBodySchema,
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
import { ShiftsService } from '../shifts/shifts.service.js';
import { EmployersService } from './employers.service.js';

@Controller('employers')
export class EmployersController {
  constructor(
    private readonly employers: EmployersService,
    private readonly config: AppConfigService,
    private readonly shifts: ShiftsService,
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

  @Get()
  @UseGuards(JwtAuthGuard)
  async listMine(@Req() req: Request) {
    const data = await this.employers.listWorkplaces(req.userId!);
    return successResponse(req.requestId ?? '', data);
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

  @Get('me/calendar')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer', 'manager')
  async calendar(
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.shifts.listEmployerCalendar(
      req.authContext!,
      from,
      to,
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

  @Get('me/managers')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer')
  async listManagers(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İşveren bağlamı gerekli.',
      );
    }
    const data = await this.employers.listWorkplaceManagers(
      req.userId!,
      employerId,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('me/managers/:userId')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer')
  async patchManager(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(managerAssignmentPatchBodySchema))
    body: unknown,
  ) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İşveren bağlamı gerekli.',
      );
    }
    const parsed = managerAssignmentPatchBodySchema.parse(body);
    const data = await this.employers.patchWorkplaceManager(
      req.userId!,
      employerId,
      userId,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('me/manager-invite')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer')
  async patchManagerInvite(
    @Req() req: Request,
    @Body(new ZodValidationPipe(managerInvitePatchBodySchema)) body: unknown,
  ) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İşveren bağlamı gerekli.',
      );
    }
    const parsed = managerInvitePatchBodySchema.parse(body);
    const data = await this.employers.patchWorkplaceManagerInvite(
      req.userId!,
      employerId,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('me/manager-invite')
  @UseGuards(RoleContextGuard)
  @RequireRoles('employer')
  async managerInvite(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İşveren bağlamı gerekli.',
      );
    }
    const data = await this.employers.getOrCreateWorkplaceInvite(
      req.userId!,
      employerId,
    );
    return successResponse(req.requestId ?? '', data);
  }
}
