import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdminBroadcastBody,
  AdminJobForceCloseBody,
  AdminRatingModerationPatchBody,
  AdminRemoteConfigBody,
  AdminTokenCreditBody,
  AdminUserPatchBody,
  AdminVerificationPatchBody,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { evaluateJobEligibility } from '../matching/matching.service.js';
import { FavoritesService } from '../favorites/favorites.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PlatformService } from '../platform/platform.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { WorkerDocumentsService } from '../workers/worker-documents.service.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { SessionService } from '../auth/session.service.js';

function maskPhone(phone: string): string {
  if (phone.length < 8) {
    return phone;
  }
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

@Injectable()
export class AdminOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly notifications: NotificationsService,
    private readonly favorites: FavoritesService,
    private readonly workerDocuments: WorkerDocumentsService,
    private readonly audit: LegalAuditLogger,
    private readonly sessions: SessionService,
    private readonly platform: PlatformService,
  ) {}

  async dashboard() {
    const [
      openAbuseReports,
      openDisputes,
      pendingVerification,
      outboxPending,
      openDevopsErrors,
      queuedRatings,
    ] = await Promise.all([
      this.prisma.abuseReport.count({ where: { status: 'open' } }),
      this.prisma.checkInDispute.count({ where: { status: 'open' } }),
      this.prisma.employer.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.outboxEvent.count({ where: { status: 'pending' } }),
      this.prisma.devopsErrorGroup.count({ where: { status: 'open' } }),
      this.prisma.rating.count({ where: { moderationStatus: 'queued' } }),
    ]);
    return {
      openAbuseReports,
      openDisputes,
      pendingVerification,
      outboxPending,
      openDevopsErrors,
      queuedRatings,
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        employerMemberships: { include: { employer: true } },
        platformAdmin: true,
        policyAcceptances: { include: { policy: true } },
      },
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Kullanıcı bulunamadı.',
      );
    }
    return {
      id: user.id,
      phoneE164: maskPhone(user.phoneE164),
      status: user.status,
      locale: user.locale,
      createdAt: user.createdAt.toISOString(),
      workerProfileId: user.workerProfile?.id ?? null,
      employerIds: user.employerMemberships.map((m) => m.employerId),
      isPlatformAdmin: Boolean(user.platformAdmin),
      policyAcceptances: user.policyAcceptances.map((a) => ({
        policyId: a.policyId,
        slug: a.policy.slug,
        version: a.policy.version,
        acceptedAt: a.acceptedAt.toISOString(),
      })),
    };
  }

  async listUsers(search?: string, limit = 50) {
    const rows = await this.prisma.user.findMany({
      where: search
        ? { phoneE164: { contains: search.replace(/\s/g, '') } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        workerProfile: true,
        employerMemberships: true,
        platformAdmin: true,
        branchManagers: true,
      },
    });
    return {
      items: rows.map((user) => {
        const roles: string[] = [];
        if (user.workerProfile) roles.push('worker');
        if (user.employerMemberships.length) roles.push('employer');
        if (user.branchManagers.length) roles.push('manager');
        if (user.platformAdmin) roles.push('admin');
        return {
          id: user.id,
          phoneE164: maskPhone(user.phoneE164),
          status: user.status,
          roles,
          createdAt: user.createdAt.toISOString(),
        };
      }),
    };
  }

  async patchUser(
    actorUserId: string,
    userId: string,
    body: AdminUserPatchBody,
    requestId: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employerMemberships: { include: { employer: true } },
      },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Kullanıcı bulunamadı.',
      );
    }
    const taxIds = existing.employerMemberships
      .map((row) => row.employer.taxId)
      .filter((taxId): taxId is string => Boolean(taxId));
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: body.status },
    });
    if (body.status === 'banned') {
      const phoneBan = await this.prisma.authBan.findFirst({
        where: { phoneE164: existing.phoneE164 },
      });
      if (!phoneBan) {
        await this.prisma.authBan.create({
          data: {
            phoneE164: existing.phoneE164,
            reason: 'admin_status_banned',
          },
        });
      }
      for (const taxId of taxIds) {
        const taxBan = await this.prisma.authBan.findFirst({
          where: { taxId },
        });
        if (!taxBan) {
          await this.prisma.authBan.create({
            data: { taxId, reason: 'admin_status_banned' },
          });
        }
      }
      await this.sessions.revokeAllForUser(userId);
    }
    if (body.status === 'active') {
      await this.prisma.authBan.deleteMany({
        where: {
          reason: 'admin_status_banned',
          OR: [
            { phoneE164: existing.phoneE164 },
            ...(taxIds.length > 0 ? [{ taxId: { in: taxIds } }] : []),
          ],
        },
      });
    }
    await this.audit.append({
      category: 'admin_action',
      action: 'user.status_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'user',
      resourceId: userId,
      requestId,
      metadata: { status: body.status },
    });
    return { id: updated.id, status: updated.status };
  }

  async listWorkers(limit = 50) {
    const rows = await this.prisma.workerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { user: true },
    });
    return {
      items: rows.map((w) => ({
        id: w.id,
        userId: w.userId,
        firstName: w.firstName,
        lastName: w.lastName,
        phoneE164: maskPhone(w.user.phoneE164),
        createdAt: w.createdAt.toISOString(),
      })),
    };
  }

  async getWorker(workerProfileId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
      include: {
        user: true,
        sectors: true,
        occupations: true,
        availability: true,
        documents: true,
      },
    });
    if (!worker) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İş arayan bulunamadı.',
      );
    }
    const favorites = await this.prisma.favorite.findMany({
      where: { ownerUserId: worker.userId },
      take: 50,
    });
    return { worker, favorites };
  }

  async listEmployers(limit = 50) {
    const rows = await this.prisma.employer.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async getEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        branches: true,
        memberships: {
          include: { user: { select: { id: true, phoneE164: true, status: true } } },
        },
        tokenAccount: true,
      },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const favorites = await this.prisma.favorite.findMany({
      where: { ownerUserId: { in: employer.memberships.map((m) => m.userId) } },
      take: 50,
    });
    return { employer, favorites };
  }

  async listPolicies() {
    const rows = await this.prisma.policyDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        version: row.version,
        required: row.required,
        contentUrl: row.contentUrl,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async listCatalogItems() {
    const rows = await this.prisma.jobCatalogItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return { items: rows };
  }

  async perfMetrics() {
    const dashboard = await this.dashboard();
    const outboxFailed = await this.prisma.outboxEvent.count({
      where: { status: 'failed' },
    });
    const openErrorGroups = await this.prisma.devopsErrorGroup.count({
      where: { status: 'open' },
    });
    return {
      ...dashboard,
      outboxFailed,
      openErrorGroups,
    };
  }

  async patchEmployerVerification(
    actorUserId: string,
    employerId: string,
    body: AdminVerificationPatchBody,
    requestId: string,
  ) {
    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: { verificationStatus: body.verificationStatus },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'employer.verification_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: { verificationStatus: body.verificationStatus },
    });
    return updated;
  }

  async listBranches(limit = 50) {
    const rows = await this.prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { employer: true },
    });
    return { items: rows };
  }

  async getJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true, branch: true, applications: true },
    });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    return job;
  }

  async getApplication(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, workerUser: true },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    return application;
  }

  async getShift(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: true, workerUser: true, checkIns: true },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    return shift;
  }

  async getRating(ratingId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });
    if (!rating) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Puan bulunamadı.',
      );
    }
    return rating;
  }

  async getAbuseReport(reportId: string) {
    const report = await this.prisma.abuseReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Rapor bulunamadı.',
      );
    }
    return report;
  }

  async listJobs(limit = 50) {
    const rows = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { employer: true, branch: true },
    });
    return { items: rows };
  }

  async forceCloseJob(
    actorUserId: string,
    jobId: string,
    body: AdminJobForceCloseBody,
    requestId: string,
  ) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: jobId },
        data: { status: 'closed', remainingHeadcount: 0 },
      });
    });
    await this.tokens.releaseHold(jobId, 'admin_force_close', `admin-close:${jobId}`);
    await this.audit.append({
      category: 'admin_action',
      action: 'job.force_closed',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job',
      resourceId: jobId,
      requestId,
      metadata: { reason: body.reason },
    });
    return { id: jobId, status: 'closed' };
  }

  async listApplications(limit = 50) {
    const rows = await this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { job: true, workerUser: true },
    });
    return { items: rows };
  }

  async listShifts(limit = 50) {
    const rows = await this.prisma.shift.findMany({
      orderBy: { startsAt: 'desc' },
      take: Math.min(limit, 100),
      include: { job: true, workerUser: true },
    });
    return { items: rows };
  }

  async listDisputes(limit = 50) {
    const rows = await this.prisma.checkInDispute.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async listRatingsQueue(limit = 50) {
    const rows = await this.prisma.rating.findMany({
      where: { moderationStatus: 'queued' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async patchRating(
    actorUserId: string,
    ratingId: string,
    body: AdminRatingModerationPatchBody,
    requestId: string,
  ) {
    const updated = await this.prisma.rating.update({
      where: { id: ratingId },
      data: { moderationStatus: body.moderationStatus },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'rating.moderation_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'rating',
      resourceId: ratingId,
      requestId,
      metadata: { moderationStatus: body.moderationStatus },
    });
    return updated;
  }

  async listDocuments(limit = 50) {
    const rows = await this.prisma.workerDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 100),
      include: { workerProfile: { include: { user: true } } },
    });
    return {
      items: rows.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        status: d.status,
        fileName: d.fileName,
        workerProfileId: d.workerProfileId,
        workerUserId: d.workerProfile.userId,
        updatedAt: d.updatedAt.toISOString(),
      })),
    };
  }

  async listOutbox(limit = 50) {
    const rows = await this.prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async broadcast(
    actorUserId: string,
    body: AdminBroadcastBody,
    requestId: string,
  ) {
    const users =
      body.audience === 'all_workers'
        ? await this.prisma.user.findMany({
            where: { workerProfile: { isNot: null } },
            select: { id: true },
            take: 5000,
          })
        : await this.prisma.user.findMany({
            where: { employerMemberships: { some: {} } },
            select: { id: true },
            take: 5000,
          });

    await this.prisma.$transaction(async (tx) => {
      for (const user of users) {
        await this.notifications.enqueueInTransaction(tx, {
          userId: user.id,
          type: 'admin.broadcast',
          dedupeKey: `admin.broadcast:${requestId}:${user.id}`,
          templateInput: { jobTitle: body.title, branchName: body.body },
          data: { title: body.title, body: body.body },
        });
      }
    });

    await this.audit.append({
      category: 'notify_broadcast',
      action: 'notifications.broadcast',
      actorUserId,
      actorRole: 'admin',
      requestId,
      metadata: { audience: body.audience, recipientCount: users.length },
    });
    return { recipientCount: users.length };
  }

  async listTokenLedger(limit = 50) {
    const rows = await this.prisma.tokenLedgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async creditEmployerTokens(
    actorUserId: string,
    employerId: string,
    body: AdminTokenCreditBody,
    requestId: string,
  ) {
    const result = await this.tokens.creditTopUp(
      employerId,
      body.amount,
      `admin-credit:${employerId}:${requestId}`,
    );
    await this.audit.append({
      category: 'token_adjust',
      action: 'employer.token_credit',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: { amount: body.amount, note: body.note },
    });
    return result;
  }

  async matchingDiagnostics(jobId: string, workerUserId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { branch: true },
    });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: workerUserId },
      include: { sectors: true, occupations: true, availability: true },
    });
    if (!worker) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İş arayan bulunamadı.',
      );
    }
    const favoredEmployerIds =
      await this.favorites.favoredEmployerIdsForWorker(workerUserId, [
        job.employerId,
      ]);
    const uploadedDocumentTypes =
      await this.workerDocuments.uploadedTypesForUser(workerUserId);
    const timeZone = await this.platform.timeZone();
    const required = Array.isArray(job.requiredDocumentTypes)
      ? job.requiredDocumentTypes.filter((v): v is string => typeof v === 'string')
      : [];
    const eligibility = evaluateJobEligibility(
      {
        id: job.id,
        employerId: job.employerId,
        status: job.status,
        sectorCode: job.sectorCode,
        occupationCode: job.occupationCode,
        startsAt: job.startsAt,
        endsAt: job.endsAt,
        remainingHeadcount: job.remainingHeadcount,
        favoritesOnly: job.favoritesOnly,
        genderFilter: job.genderFilter,
        minAge: job.minAge,
        maxAge: job.maxAge,
        requiredDocumentTypes: required,
        branchLatitude: Number(job.branch.latitude),
        branchLongitude: Number(job.branch.longitude),
      },
      {
        profile: worker,
        sectors: worker.sectors,
        occupations: worker.occupations,
        windows: worker.availability,
      },
      { favoredEmployerIds, uploadedDocumentTypes, timeZone },
    );
    return eligibility;
  }

  async getRemoteConfig() {
    const row = await this.prisma.remoteConfig.findUnique({
      where: { id: 'default' },
    });
    return row;
  }

  async patchRemoteConfig(
    actorUserId: string,
    body: AdminRemoteConfigBody,
    requestId: string,
  ) {
    const updated = await this.prisma.remoteConfig.update({
      where: { id: 'default' },
      data: body,
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'config.remote_updated',
      actorUserId,
      actorRole: 'admin',
      requestId,
      metadata: body,
    });
    return updated;
  }

  async listRiskEvents(limit = 50) {
    const rows = await this.prisma.riskEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { user: true },
    });
    return { items: rows };
  }

  async listAbuseReports(limit = 50) {
    const rows = await this.prisma.abuseReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }

  async resolveAbuseReport(
    actorUserId: string,
    reportId: string,
    requestId: string,
  ) {
    const updated = await this.prisma.abuseReport.update({
      where: { id: reportId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedByUserId: actorUserId,
      },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'abuse.report_resolved',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'abuse_report',
      resourceId: reportId,
      requestId,
    });
    return updated;
  }

  async verificationQueue(limit = 50) {
    const rows = await this.prisma.employer.findMany({
      where: { verificationStatus: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 100),
    });
    return { items: rows };
  }
}
