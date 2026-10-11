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
  devopsErrorIngestSchema,
  devopsErrorPatchSchema,
  devopsErrorsListQuerySchema,
  devopsReleaseRegisterSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { AdminMcpGuard } from '../admin/admin-mcp.guard.js';
import { PlatformAdminGuard } from '../admin/platform-admin.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { DevopsErrorsService } from './devops-errors.service.js';
import { DevopsReleasesService } from './devops-releases.service.js';
import { DevopsServicesService } from './devops-services.service.js';

@Controller('admin/devops')
export class DevopsController {
  constructor(
    private readonly errors: DevopsErrorsService,
    private readonly releases: DevopsReleasesService,
    private readonly services: DevopsServicesService,
  ) {}

  @Get('overview')
  @UseGuards(PlatformAdminGuard)
  async overview(@Req() req: Request) {
    const data = await this.services.overview();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('services')
  @UseGuards(PlatformAdminGuard)
  async servicesStatus(@Req() req: Request) {
    const data = await this.services.aggregate();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('clients')
  @UseGuards(PlatformAdminGuard)
  async clients(@Req() req: Request) {
    const data = await this.services.clients();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('errors')
  @UseGuards(PlatformAdminGuard)
  async listErrors(
    @Req() req: Request,
    @Query(new ZodValidationPipe(devopsErrorsListQuerySchema)) query: unknown,
  ) {
    const parsed = devopsErrorsListQuerySchema.parse(query);
    const data = await this.errors.list(parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('errors/:fingerprint')
  @UseGuards(PlatformAdminGuard)
  async getError(@Req() req: Request, @Param('fingerprint') fingerprint: string) {
    const data = await this.errors.getByFingerprint(fingerprint);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('errors/:fingerprint')
  @UseGuards(PlatformAdminGuard)
  async patchError(
    @Req() req: Request,
    @Param('fingerprint') fingerprint: string,
    @Body(new ZodValidationPipe(devopsErrorPatchSchema)) body: unknown,
  ) {
    const parsed = devopsErrorPatchSchema.parse(body);
    const data = await this.errors.patch(
      fingerprint,
      parsed,
      req.userId!,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('errors')
  @UseGuards(AdminMcpGuard)
  async ingest(
    @Req() req: Request,
    @Body(new ZodValidationPipe(devopsErrorIngestSchema)) body: unknown,
  ) {
    const parsed = devopsErrorIngestSchema.parse(body);
    await this.errors.ingest(parsed);
    return successResponse(req.requestId ?? '', { accepted: true });
  }

  @Get('releases')
  @UseGuards(PlatformAdminGuard)
  async listReleases(
    @Req() req: Request,
    @Query('app') app?: string,
    @Query('environment') environment?: string,
  ) {
    const data = await this.releases.list(app, environment);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('releases')
  @UseGuards(AdminMcpGuard)
  async registerRelease(
    @Req() req: Request,
    @Body(new ZodValidationPipe(devopsReleaseRegisterSchema)) body: unknown,
  ) {
    const parsed = devopsReleaseRegisterSchema.parse(body);
    const data = await this.releases.register(parsed);
    return successResponse(req.requestId ?? '', data);
  }
}
