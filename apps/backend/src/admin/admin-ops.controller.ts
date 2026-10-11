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
  adminBroadcastSchema,
  adminJobForceCloseSchema,
  adminMatchingDiagnosticsQuerySchema,
  adminRatingModerationPatchSchema,
  adminRemoteConfigSchema,
  adminTokenCreditSchema,
  adminUserPatchSchema,
  adminVerificationPatchSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PlatformAdminGuard } from './platform-admin.guard.js';
import { AdminOpsService } from './admin-ops.service.js';

@Controller('admin')
@UseGuards(PlatformAdminGuard)
export class AdminOpsController {
  constructor(private readonly ops: AdminOpsService) {}

  @Get('dashboard')
  async dashboard(@Req() req: Request) {
    const data = await this.ops.dashboard();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('users')
  async users(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.ops.listUsers(search, limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('users/:id')
  async userDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getUser(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('users/:id')
  async patchUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUserPatchSchema)) body: unknown,
  ) {
    const parsed = adminUserPatchSchema.parse(body);
    const data = await this.ops.patchUser(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('workers')
  async workers(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listWorkers(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('workers/:id')
  async workerDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getWorker(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('employers')
  async employers(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listEmployers(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('employers/:id')
  async employerDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getEmployer(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('employers/:id/verification')
  async patchVerification(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminVerificationPatchSchema)) body: unknown,
  ) {
    const parsed = adminVerificationPatchSchema.parse(body);
    const data = await this.ops.patchEmployerVerification(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('branches')
  async branches(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listBranches(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('jobs')
  async jobs(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listJobs(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('jobs/:id')
  async jobDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getJob(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('jobs/:id/force-close')
  async forceCloseJob(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminJobForceCloseSchema)) body: unknown,
  ) {
    const parsed = adminJobForceCloseSchema.parse(body);
    const data = await this.ops.forceCloseJob(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('applications')
  async applications(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listApplications(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('applications/:id')
  async applicationDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getApplication(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('shifts')
  async shifts(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listShifts(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('shifts/:id')
  async shiftDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getShift(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('disputes')
  async disputes(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listDisputes(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('ratings/queue')
  async ratingsQueue(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listRatingsQueue(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('ratings/:id')
  async ratingDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getRating(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('ratings/:id')
  async patchRating(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminRatingModerationPatchSchema)) body: unknown,
  ) {
    const parsed = adminRatingModerationPatchSchema.parse(body);
    const data = await this.ops.patchRating(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('documents')
  async documents(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listDocuments(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('notifications/outbox')
  async outbox(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listOutbox(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('notifications/broadcast')
  async broadcast(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminBroadcastSchema)) body: unknown,
  ) {
    const parsed = adminBroadcastSchema.parse(body);
    const data = await this.ops.broadcast(
      req.userId!,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('tokens/ledger')
  async tokenLedger(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listTokenLedger(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('employers/:id/tokens/credit')
  async creditTokens(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminTokenCreditSchema)) body: unknown,
  ) {
    const parsed = adminTokenCreditSchema.parse(body);
    const data = await this.ops.creditEmployerTokens(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('matching/diagnostics')
  async matchingDiagnostics(
    @Req() req: Request,
    @Query(new ZodValidationPipe(adminMatchingDiagnosticsQuerySchema))
    query: unknown,
  ) {
    const parsed = adminMatchingDiagnosticsQuerySchema.parse(query);
    const data = await this.ops.matchingDiagnostics(
      parsed.jobId,
      parsed.workerUserId,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('config/remote')
  async remoteConfig(@Req() req: Request) {
    const data = await this.ops.getRemoteConfig();
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('config/remote')
  async patchRemoteConfig(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminRemoteConfigSchema)) body: unknown,
  ) {
    const parsed = adminRemoteConfigSchema.parse(body);
    const data = await this.ops.patchRemoteConfig(
      req.userId!,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('risk-events')
  async riskEvents(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listRiskEvents(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('abuse-reports')
  async abuseReports(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listAbuseReports(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('abuse-reports/:id')
  async abuseReportDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getAbuseReport(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('abuse-reports/:id/resolve')
  async resolveAbuse(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const data = await this.ops.resolveAbuseReport(
      req.userId!,
      id,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('verification/queue')
  async verificationQueue(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.verificationQueue(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('policies')
  async policies(@Req() req: Request) {
    const data = await this.ops.listPolicies();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('catalog')
  async catalog(@Req() req: Request) {
    const data = await this.ops.listCatalogItems();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('perf/metrics')
  async perfMetrics(@Req() req: Request) {
    const data = await this.ops.perfMetrics();
    return successResponse(req.requestId ?? '', data);
  }
}
