import {
  Body,
  Controller,
  Delete,
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
  adminSmsSettingsPatchSchema,
  adminAdaptySettingsPatchSchema,
  adminTokenCreditSchema,
  adminUserPatchSchema,
  adminPolicyPatchSchema,
  adminVerificationPatchSchema,
  adminSubscriptionPlanPatchSchema,
  adminEmployerSubscriptionPatchSchema,
  adminSupportTicketPatchSchema,
  supportTicketMessageCreateSchema,
  adminJobCatalogCreateSchema,
  adminJobCatalogPatchSchema,
  adminJobCatalogSectorCreateSchema,
  adminJobCatalogSectorPatchSchema,
  adminJobCatalogOccupationCreateSchema,
  adminJobCatalogOccupationPatchSchema,
  adminTokenPackageCreateSchema,
  adminTokenPackagePatchSchema,
  adminBranchCreateBodySchema,
  adminBranchPatchBodySchema,
  adminEmployerPatchSchema,
  adminApplicationStatusPatchSchema,
  adminJobPatchSchema,
  adminWorkerPatchSchema,
  adminDocumentPatchSchema,
  adminDisputePatchSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PoliciesService } from '../policies/policies.service.js';
import { PlatformAdminGuard } from './platform-admin.guard.js';
import { AdminOpsService } from './admin-ops.service.js';

@Controller('admin')
@UseGuards(PlatformAdminGuard)
export class AdminOpsController {
  constructor(
    private readonly ops: AdminOpsService,
    private readonly policyDocs: PoliciesService,
  ) {}

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

  @Post('users/:id/sessions/revoke')
  async revokeUserSessions(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.revokeUserSessions(
      req.userId!,
      id,
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

  @Patch('workers/:id')
  async patchWorker(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminWorkerPatchSchema)) body: unknown,
  ) {
    const parsed = adminWorkerPatchSchema.parse(body);
    const data = await this.ops.patchWorker(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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

  @Patch('employers/:id')
  async patchEmployer(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminEmployerPatchSchema)) body: unknown,
  ) {
    const parsed = adminEmployerPatchSchema.parse(body);
    const data = await this.ops.patchEmployer(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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
  async branches(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('employerId') employerId?: string,
  ) {
    const data = await this.ops.listBranches(
      limit ? Number(limit) : 50,
      employerId,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('branches/:id')
  async branchDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getBranch(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('branches')
  async createBranch(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminBranchCreateBodySchema)) body: unknown,
  ) {
    const parsed = adminBranchCreateBodySchema.parse(body);
    const data = await this.ops.createBranch(
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('branches/:id')
  async patchBranch(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminBranchPatchBodySchema)) body: unknown,
  ) {
    const parsed = adminBranchPatchBodySchema.parse(body);
    const data = await this.ops.patchBranch(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
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

  @Patch('jobs/:id')
  async patchJob(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminJobPatchSchema)) body: unknown,
  ) {
    const parsed = adminJobPatchSchema.parse(body);
    const data = await this.ops.patchJob(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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

  @Patch('applications/:id')
  async patchApplication(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminApplicationStatusPatchSchema)) body: unknown,
  ) {
    const parsed = adminApplicationStatusPatchSchema.parse(body);
    const data = await this.ops.patchApplicationStatus(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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

  @Post('shifts/:id/manual-confirm')
  async manualConfirmShift(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.manualConfirmShift(
      req.userId!,
      id,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('disputes')
  async disputes(@Req() req: Request, @Query('limit') limit?: string) {
    const data = await this.ops.listDisputes(limit ? Number(limit) : 50);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('disputes/:id')
  async disputeDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getDispute(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('disputes/:id')
  async patchDispute(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminDisputePatchSchema)) body: unknown,
  ) {
    const parsed = adminDisputePatchSchema.parse(body);
    const data = await this.ops.patchDispute(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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

  @Get('documents/:id')
  async documentDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getDocument(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('documents/:id/download')
  async documentDownload(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.documentDownloadUrl(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('documents/:id')
  async patchDocument(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminDocumentPatchSchema)) body: unknown,
  ) {
    const parsed = adminDocumentPatchSchema.parse(body);
    const data = await this.ops.patchDocument(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
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

  @Get('tokens/packages')
  async tokenPackages(@Req() req: Request) {
    const data = await this.ops.listTokenPackages();
    return successResponse(req.requestId ?? '', data);
  }

  @Post('tokens/packages')
  async createTokenPackage(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminTokenPackageCreateSchema)) body: unknown,
  ) {
    const parsed = adminTokenPackageCreateSchema.parse(body);
    const data = await this.ops.createTokenPackage(
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('tokens/packages/:id')
  async patchTokenPackage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminTokenPackagePatchSchema)) body: unknown,
  ) {
    const parsed = adminTokenPackagePatchSchema.parse(body);
    const data = await this.ops.patchTokenPackage(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
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

  @Get('config/sms')
  async smsSettings(@Req() req: Request) {
    const data = await this.ops.getSmsSettings();
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('config/sms')
  async patchSmsSettings(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminSmsSettingsPatchSchema)) body: unknown,
  ) {
    const parsed = adminSmsSettingsPatchSchema.parse(body);
    const data = await this.ops.patchSmsSettings(
      req.userId!,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('config/adapty')
  async adaptySettings(@Req() req: Request) {
    const data = await this.ops.getAdaptySettings();
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('config/adapty')
  async patchAdaptySettings(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminAdaptySettingsPatchSchema)) body: unknown,
  ) {
    const parsed = adminAdaptySettingsPatchSchema.parse(body);
    const data = await this.ops.patchAdaptySettings(
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

  @Patch('policies/:id')
  async updatePolicy(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminPolicyPatchSchema)) body: unknown,
  ) {
    const parsed = adminPolicyPatchSchema.parse(body);
    const data = await this.policyDocs.updateDocument(
      req.userId!,
      id,
      parsed,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('catalog')
  async catalog(@Req() req: Request) {
    const data = await this.ops.listCatalogItems();
    return successResponse(req.requestId ?? '', data);
  }

  @Post('catalog/sectors')
  async createCatalogSector(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminJobCatalogSectorCreateSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogSectorCreateSchema.parse(body);
    const data = await this.ops.createCatalogSector(
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('catalog/sectors/:id')
  async patchCatalogSector(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminJobCatalogSectorPatchSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogSectorPatchSchema.parse(body);
    const data = await this.ops.patchCatalogSector(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('catalog/sectors/:sectorId/occupations')
  async createCatalogOccupation(
    @Req() req: Request,
    @Param('sectorId') sectorId: string,
    @Body(new ZodValidationPipe(adminJobCatalogOccupationCreateSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogOccupationCreateSchema.parse(body);
    const data = await this.ops.createCatalogOccupation(
      sectorId,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('catalog/occupations/:id')
  async patchCatalogOccupation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminJobCatalogOccupationPatchSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogOccupationPatchSchema.parse(body);
    const data = await this.ops.patchCatalogOccupation(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Delete('catalog/sectors/:id')
  async deleteCatalogSector(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.deleteCatalogSector(
      id,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Delete('catalog/occupations/:id')
  async deleteCatalogOccupation(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.deleteCatalogOccupation(
      id,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('catalog')
  async createCatalogItem(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminJobCatalogCreateSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogCreateSchema.parse(body);
    const data = await this.ops.createCatalogItem(
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('catalog/:id')
  async patchCatalogItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminJobCatalogPatchSchema)) body: unknown,
  ) {
    const parsed = adminJobCatalogPatchSchema.parse(body);
    const data = await this.ops.patchCatalogItem(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('perf/metrics')
  async perfMetrics(@Req() req: Request) {
    const data = await this.ops.perfMetrics();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('subscriptions/plans')
  async subscriptionPlans(@Req() req: Request) {
    const data = await this.ops.listSubscriptionPlans();
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('subscriptions/plans/:id')
  async patchSubscriptionPlan(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminSubscriptionPlanPatchSchema)) body: unknown,
  ) {
    const parsed = adminSubscriptionPlanPatchSchema.parse(body);
    const data = await this.ops.patchSubscriptionPlan(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('employers/:id/subscription')
  async patchEmployerSubscription(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminEmployerSubscriptionPatchSchema)) body: unknown,
  ) {
    const parsed = adminEmployerSubscriptionPatchSchema.parse(body);
    const data = await this.ops.patchEmployerSubscription(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('support/tickets')
  async supportTickets(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.ops.listSupportTickets(
      limit ? Number(limit) : 50,
      status,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('support/tickets/:id')
  async supportTicketDetail(@Req() req: Request, @Param('id') id: string) {
    const data = await this.ops.getSupportTicket(id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('support/tickets/:id/messages')
  async supportTicketReply(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(supportTicketMessageCreateSchema)) body: unknown,
  ) {
    const parsed = supportTicketMessageCreateSchema.parse(body);
    const data = await this.ops.replySupportTicket(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('support/tickets/:id')
  async patchSupportTicket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminSupportTicketPatchSchema)) body: unknown,
  ) {
    const parsed = adminSupportTicketPatchSchema.parse(body);
    const data = await this.ops.patchSupportTicket(
      id,
      parsed,
      req.userId!,
      req.requestId ?? '',
    );
    return successResponse(req.requestId ?? '', data);
  }
}
