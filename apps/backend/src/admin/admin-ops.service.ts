import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdminApplicationStatusPatchBody,
  AdminBroadcastBody,
  AdminDisputePatchBody,
  AdminDocumentPatchBody,
  AdminEmployerPatchBody,
  AdminJobForceCloseBody,
  AdminJobPatchBody,
  AdminRatingModerationPatchBody,
  AdminAdaptySettingsBody,
  AdminRemoteConfigBody,
  AdminSmsSettingsBody,
  AdminTokenAllocateBody,
  AdminTokenCreditBody,
  AdminManagerPatchBody,
  AdminTokenRequestPatchBody,
  AdminUserPatchBody,
  AdminVerificationPatchBody,
  AdminWorkerPatchBody,
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
import { parseManagerPermissions } from '../auth/manager-permissions.js';
import { MembershipService } from '../auth/membership.service.js';
import { SessionService } from '../auth/session.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { SupportService } from '../support/support.service.js';
import { JobCatalogService } from '../job-catalog/job-catalog.service.js';
import { TokenPackagesService } from '../tokens/token-packages.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { ApplicationsService } from '../applications/applications.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { loadDashboardAnalytics } from './admin-dashboard-analytics.js';

function maskPhone(phone: string): string {
  if (phone.length < 8) {
    return phone;
  }
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
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
    private readonly subscriptions: SubscriptionsService,
    private readonly support: SupportService,
    private readonly jobCatalog: JobCatalogService,
    private readonly tokenPackages: TokenPackagesService,
    private readonly branches: BranchesService,
    private readonly applications: ApplicationsService,
    private readonly shifts: ShiftsService,
    private readonly membership: MembershipService,
  ) {}

  async dashboard() {
    const [
      openAbuseReports,
      openDisputes,
      pendingVerification,
      outboxPending,
      openDevopsErrors,
      queuedRatings,
      openSupportTickets,
      analytics,
    ] = await Promise.all([
      this.prisma.abuseReport.count({ where: { status: 'open' } }),
      this.prisma.checkInDispute.count({ where: { status: 'open' } }),
      this.prisma.employer.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.outboxEvent.count({ where: { status: 'pending' } }),
      this.prisma.devopsErrorGroup.count({ where: { status: 'open' } }),
      this.prisma.rating.count({ where: { moderationStatus: 'queued' } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } },
      }),
      loadDashboardAnalytics(this.prisma),
    ]);
    return {
      openAbuseReports,
      openDisputes,
      pendingVerification,
      outboxPending,
      openDevopsErrors,
      queuedRatings,
      openSupportTickets,
      ...analytics,
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
      employerPublicCode: user.employerPublicCode,
      workerPublicCode: user.workerProfile?.publicCode ?? null,
      workerProfileId: user.workerProfile?.id ?? null,
      employerIds: user.employerMemberships.map((m) => m.employerId),
      isPlatformAdmin: Boolean(user.platformAdmin),
      policyAcceptances: user.policyAcceptances.map((a) => ({
        policyId: a.policyId,
        slug: a.policy.slug,
        version: a.acceptedVersion,
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
          employerPublicCode: user.employerPublicCode,
          workerPublicCode: user.workerProfile?.publicCode ?? null,
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
        publicCode: w.publicCode,
        firstName: w.firstName,
        lastName: w.lastName,
        nightShiftAvailable: w.nightShiftAvailable,
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
      select: { id: true, targetKind: true, targetId: true, createdAt: true },
    });
    return {
      id: worker.id,
      userId: worker.userId,
      publicCode: worker.publicCode,
      firstName: worker.firstName,
      lastName: worker.lastName,
      phoneE164: maskPhone(worker.user.phoneE164),
      userStatus: worker.user.status,
      nightShiftAvailable: worker.nightShiftAvailable,
      gender: worker.gender,
      birthDate: worker.birthDate
        ? worker.birthDate.toISOString().slice(0, 10)
        : null,
      homeLatitude:
        worker.homeLatitude != null ? Number(worker.homeLatitude) : null,
      homeLongitude:
        worker.homeLongitude != null ? Number(worker.homeLongitude) : null,
      sectors: worker.sectors.map((row) => row.sectorCode),
      occupations: worker.occupations.map((row) => row.occupationCode),
      availability: worker.availability.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        startMinute: row.startMinute,
        endMinute: row.endMinute,
        crossesMidnight: row.crossesMidnight,
      })),
      documents: worker.documents.map((row) => ({
        id: row.id,
        documentType: row.documentType,
        status: row.status,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        fileName: row.fileName,
      })),
      favorites: favorites.map((row) => ({
        id: row.id,
        targetKind: row.targetKind,
        targetId: row.targetId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async patchWorker(
    actorUserId: string,
    workerProfileId: string,
    body: AdminWorkerPatchBody,
    requestId: string,
  ) {
    const existing = await this.prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İş arayan bulunamadı.',
      );
    }
    const updated = await this.prisma.workerProfile.update({
      where: { id: workerProfileId },
      data: { nightShiftAvailable: body.nightShiftAvailable },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'worker.night_shift_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'worker_profile',
      resourceId: workerProfileId,
      requestId,
      metadata: { nightShiftAvailable: body.nightShiftAvailable },
    });
    return {
      id: updated.id,
      nightShiftAvailable: updated.nightShiftAvailable,
    };
  }

  async listEmployers(limit = 50) {
    const rows = await this.prisma.employer.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        taxId: true,
        publicCode: true,
        verificationStatus: true,
        subscriptionPlanCode: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        legalName: row.legalName,
        tradingName: row.tradingName,
        taxId: row.taxId,
        publicCode: row.publicCode,
        verificationStatus: row.verificationStatus,
        subscriptionPlanCode: row.subscriptionPlanCode,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async patchEmployer(
    actorUserId: string,
    employerId: string,
    body: AdminEmployerPatchBody,
    requestId: string,
  ) {
    const existing = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    if (
      body.legalName === undefined &&
      body.tradingName === undefined &&
      body.addressLine1 === undefined &&
      body.city === undefined &&
      body.latitude === undefined &&
      body.longitude === undefined
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Güncellenecek alan belirtilmedi.',
      );
    }
    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        ...(body.legalName !== undefined && { legalName: body.legalName }),
        ...(body.tradingName !== undefined && {
          tradingName: body.tradingName,
        }),
        ...(body.addressLine1 !== undefined && {
          addressLine1: body.addressLine1,
        }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.latitude !== undefined && {
          latitude: body.latitude,
        }),
        ...(body.longitude !== undefined && {
          longitude: body.longitude,
        }),
      },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'employer.profile_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: body,
    });
    return { id: updated.id, legalName: updated.legalName, tradingName: updated.tradingName };
  }

  async patchApplicationStatus(
    actorUserId: string,
    applicationId: string,
    body: AdminApplicationStatusPatchBody,
    requestId: string,
  ) {
    const application = await this.applications.adminOverrideStatus(
      actorUserId,
      applicationId,
      body.status,
      requestId,
    );
    await this.audit.append({
      category: 'admin_action',
      action: 'application.status_overridden',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'application',
      resourceId: applicationId,
      requestId,
      metadata: { status: body.status, reason: body.reason },
    });
    return application;
  }

  async getEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            city: true,
            status: true,
            publicCode: true,
          },
        },
        memberships: {
          include: {
            user: { select: { id: true, phoneE164: true, status: true } },
          },
        },
        tokenAccount: true,
        workplaceManagers: {
          include: {
            user: { select: { id: true, phoneE164: true, status: true } },
          },
        },
        tokenRequests: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const memberUserIds = employer.memberships.map((row) => row.userId);
    const owner = employer.memberships.find((row) => row.role === 'owner');
    const [favorites, holds, ownerPurse] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { ownerUserId: { in: memberUserIds } },
        take: 50,
        select: {
          id: true,
          targetKind: true,
          targetId: true,
          createdAt: true,
        },
      }),
      this.prisma.tokenHold.findMany({
        where: { employerId, status: 'held' },
        select: { id: true, jobId: true, amount: true, status: true },
      }),
      owner
        ? this.prisma.tokenAccount.findUnique({
            where: { ownerUserId: owner.userId },
          })
        : Promise.resolve(null),
    ]);
    return {
      id: employer.id,
      legalName: employer.legalName,
      tradingName: employer.tradingName,
      taxId: employer.taxId,
      publicCode: employer.publicCode,
      verificationStatus: employer.verificationStatus,
      subscriptionPlanCode: employer.subscriptionPlanCode,
      subscriptionStatus: employer.subscriptionStatus,
      subscriptionEndsAt: iso(employer.subscriptionEndsAt),
      addressLine1: employer.addressLine1,
      city: employer.city,
      latitude:
        employer.latitude != null ? Number(employer.latitude) : null,
      longitude:
        employer.longitude != null ? Number(employer.longitude) : null,
      unallocated: ownerPurse?.balance ?? 0,
      tokenBalance: employer.tokenAccount?.balance ?? 0,
      heldTokens: holds.reduce((sum, hold) => sum + hold.amount, 0),
      holds,
      branches: employer.branches,
      workplaceManagers: employer.workplaceManagers.map((row) => ({
        userId: row.userId,
        status: row.status,
        permissions: parseManagerPermissions(row.permissions),
        phoneE164: maskPhone(row.user.phoneE164),
        userStatus: row.user.status,
        scope: 'workplace',
      })),
      tokenRequests: employer.tokenRequests.map((row) => ({
        id: row.id,
        requesterUserId: row.requesterUserId,
        branchId: row.branchId,
        amount: row.amount,
        status: row.status,
        note: row.note,
        resolvedAmount: row.resolvedAmount,
        createdAt: row.createdAt.toISOString(),
        resolvedAt: iso(row.resolvedAt),
      })),
      members: employer.memberships.map((row) => ({
        userId: row.userId,
        role: row.role,
        status: row.status,
        phoneE164: maskPhone(row.user.phoneE164),
        userStatus: row.user.status,
      })),
      favorites: favorites.map((row) => ({
        id: row.id,
        targetKind: row.targetKind,
        targetId: row.targetId,
        createdAt: row.createdAt.toISOString(),
      })),
      createdAt: employer.createdAt.toISOString(),
    };
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
        body: row.body,
        version: row.version,
        required: row.required,
        contentUrl: row.contentUrl,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  listCatalogItems() {
    return this.jobCatalog.listAllAdmin();
  }

  createCatalogItem(
    body: Parameters<JobCatalogService['createAdminItem']>[0],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.createAdminItem(body, actorUserId, requestId);
  }

  patchCatalogItem(
    id: string,
    body: Parameters<JobCatalogService['patchAdminItem']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.patchAdminItem(id, body, actorUserId, requestId);
  }

  createCatalogSector(
    body: Parameters<JobCatalogService['createSector']>[0],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.createSector(body, actorUserId, requestId);
  }

  patchCatalogSector(
    id: string,
    body: Parameters<JobCatalogService['patchSector']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.patchSector(id, body, actorUserId, requestId);
  }

  createCatalogOccupation(
    sectorId: string,
    body: Parameters<JobCatalogService['createOccupation']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.createOccupation(
      sectorId,
      body,
      actorUserId,
      requestId,
    );
  }

  patchCatalogOccupation(
    id: string,
    body: Parameters<JobCatalogService['patchOccupation']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.jobCatalog.patchOccupation(id, body, actorUserId, requestId);
  }

  deleteCatalogSector(id: string, actorUserId: string, requestId: string) {
    return this.jobCatalog.deleteSector(id, actorUserId, requestId);
  }

  deleteCatalogOccupation(id: string, actorUserId: string, requestId: string) {
    return this.jobCatalog.deleteOccupation(id, actorUserId, requestId);
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

  async listBranches(limit = 50, employerId?: string) {
    const rows = await this.prisma.branch.findMany({
      where: employerId ? { employerId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        employer: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            publicCode: true,
          },
        },
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        publicCode: row.publicCode,
        city: row.city,
        status: row.status,
        employerName: row.employer.legalName,
        workplacePublicCode: row.employer.publicCode,
        employerId: row.employerId,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      })),
    };
  }

  getBranch(branchId: string) {
    return this.branches.adminGetBranch(branchId);
  }

  createBranch(
    body: Parameters<BranchesService['adminCreateBranch']>[0],
    actorUserId: string,
    requestId: string,
  ) {
    return this.branches.adminCreateBranch(body, actorUserId, requestId);
  }

  patchBranch(
    branchId: string,
    body: Parameters<BranchesService['adminPatchBranch']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.branches.adminPatchBranch(
      branchId,
      body,
      actorUserId,
      requestId,
    );
  }

  async getJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: { select: { id: true, legalName: true } },
        branch: { select: { id: true, name: true } },
        tokenHold: { select: { amount: true, status: true } },
        applications: {
          select: { id: true, status: true, workerUserId: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      favoritesOnly: job.favoritesOnly,
      headcount: job.headcount,
      remainingHeadcount: job.remainingHeadcount,
      startsAt: job.startsAt.toISOString(),
      endsAt: job.endsAt.toISOString(),
      sectorCode: job.sectorCode,
      occupationCode: job.occupationCode,
      employerId: job.employerId,
      employerName: job.employer.legalName,
      branchId: job.branchId,
      branchName: job.branch?.name ?? job.employer.legalName,
      requiredDocumentTypes: stringList(job.requiredDocumentTypes),
      amenities: stringList(job.amenities),
      instantAutoApprove: job.instantAutoApprove,
      genderFilter: job.genderFilter,
      minAge: job.minAge,
      maxAge: job.maxAge,
      payAmountMinor: job.payAmountMinor,
      payCurrency: job.payCurrency,
      holdAmount: job.tokenHold?.amount ?? 0,
      holdStatus: job.tokenHold?.status ?? null,
      applications: job.applications,
    };
  }

  async patchJob(
    actorUserId: string,
    jobId: string,
    body: AdminJobPatchBody,
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
    if (body.favoritesOnly && job.status === 'published') {
      // shortcut: counts favorite workers, not full eligibility; upgrade if admin publish must match JobsService.
      const favCount = await this.prisma.favorite.count({
        where: {
          ownerEmployerId: job.employerId,
          targetKind: 'worker_user',
        },
      });
      if (favCount === 0) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.FAVORITES_AUDIENCE_EMPTY,
          'Favori çalışan listenizde bu ilana uygun kimse yok.',
        );
      }
    }
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: { favoritesOnly: body.favoritesOnly },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'job.favorites_only_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job',
      resourceId: jobId,
      requestId,
      metadata: { favoritesOnly: body.favoritesOnly },
    });
    return { id: updated.id, favoritesOnly: updated.favoritesOnly };
  }

  async getApplication(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: { id: true, title: true, status: true, employerId: true },
        },
        workerUser: { select: { id: true, phoneE164: true, status: true } },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { eventType: true, createdAt: true, actorUserId: true },
        },
      },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    return {
      id: application.id,
      status: application.status,
      jobId: application.jobId,
      jobTitle: application.job.title,
      jobStatus: application.job.status,
      employerId: application.job.employerId,
      workerUserId: application.workerUserId,
      workerProfileId: application.workerProfileId,
      workerPhone: maskPhone(application.workerUser.phoneE164),
      workerUserStatus: application.workerUser.status,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      events: application.events.map((row) => ({
        eventType: row.eventType,
        actorUserId: row.actorUserId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async getShift(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        job: { select: { id: true, title: true, status: true } },
        workerUser: { select: { id: true, phoneE164: true } },
        checkIns: { orderBy: { createdAt: 'desc' }, take: 20 },
        disputes: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    return {
      id: shift.id,
      status: shift.status,
      jobId: shift.jobId,
      jobTitle: shift.job.title,
      jobStatus: shift.job.status,
      employerId: shift.employerId,
      branchId: shift.branchId,
      applicationId: shift.applicationId,
      workerUserId: shift.workerUserId,
      workerPhone: maskPhone(shift.workerUser.phoneE164),
      startsAt: shift.startsAt.toISOString(),
      endsAt: shift.endsAt.toISOString(),
      confirmOpensAt: shift.confirmOpensAt.toISOString(),
      confirmDeadlineAt: shift.confirmDeadlineAt.toISOString(),
      availabilityDecision: shift.availabilityDecision,
      checkedInAt: iso(shift.checkedInAt),
      completedAt: iso(shift.completedAt),
      checkIns: shift.checkIns.map((row) => ({
        id: row.id,
        success: row.success,
        locationSource: row.locationSource,
        accuracyM: Number(row.accuracyM),
        distanceM: Number(row.distanceM),
        mockLocation: row.mockLocation,
        failureCode: row.failureCode,
        createdAt: row.createdAt.toISOString(),
      })),
      disputes: shift.disputes.map((row) => ({
        id: row.id,
        note: row.note,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async manualConfirmShift(
    actorUserId: string,
    shiftId: string,
    requestId: string,
  ) {
    const result = await this.shifts.adminManualConfirm(
      actorUserId,
      shiftId,
      `admin-manual-confirm:${shiftId}:${requestId}`,
    );
    await this.audit.append({
      category: 'admin_action',
      action: 'shift.manual_confirmed',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'shift',
      resourceId: shiftId,
      requestId,
    });
    return result;
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
    return {
      id: rating.id,
      shiftId: rating.shiftId,
      score: rating.score,
      comment: rating.comment,
      moderationStatus: rating.moderationStatus,
      authorRole: rating.authorRole,
      authorUserId: rating.authorUserId,
      targetWorkerUserId: rating.targetWorkerUserId,
      targetEmployerId: rating.targetEmployerId,
      createdAt: rating.createdAt.toISOString(),
    };
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
    return {
      id: report.id,
      category: report.category,
      note: report.note,
      status: report.status,
      reporterUserId: report.reporterUserId,
      targetUserId: report.targetUserId,
      createdAt: report.createdAt.toISOString(),
      resolvedAt: iso(report.resolvedAt),
      resolvedByUserId: report.resolvedByUserId,
    };
  }

  async listJobs(limit = 50) {
    const rows = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { employer: true, branch: true },
    });
    return {
      items: rows.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        favoritesOnly: job.favoritesOnly,
        remainingHeadcount: job.remainingHeadcount,
        startsAt: job.startsAt.toISOString(),
        employer: job.employer.legalName,
        branch: job.branch?.name ?? job.employer.legalName,
      })),
    };
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
      include: {
        job: { select: { title: true } },
        workerUser: { select: { phoneE164: true } },
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        jobTitle: row.job.title,
        workerPhone: maskPhone(row.workerUser.phoneE164),
        createdAt: row.createdAt.toISOString(),
        jobId: row.jobId,
        workerUserId: row.workerUserId,
      })),
    };
  }

  async listShifts(limit = 50) {
    const rows = await this.prisma.shift.findMany({
      orderBy: { startsAt: 'desc' },
      take: Math.min(limit, 100),
      include: { job: { select: { title: true } } },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        jobTitle: row.job.title,
        startsAt: row.startsAt.toISOString(),
        availabilityDecision: row.availabilityDecision,
        checkedInAt: iso(row.checkedInAt),
        workerUserId: row.workerUserId,
      })),
    };
  }

  async listDisputes(limit = 50) {
    const rows = await this.prisma.checkInDispute.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        shiftId: row.shiftId,
        workerUserId: row.workerUserId,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async getDispute(disputeId: string) {
    const dispute = await this.prisma.checkInDispute.findUnique({
      where: { id: disputeId },
      include: {
        shift: {
          select: {
            id: true,
            status: true,
            jobId: true,
            workerUserId: true,
            checkedInAt: true,
          },
        },
      },
    });
    if (!dispute) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Uyuşmazlık bulunamadı.',
      );
    }
    return {
      id: dispute.id,
      status: dispute.status,
      shiftId: dispute.shiftId,
      shiftStatus: dispute.shift.status,
      jobId: dispute.shift.jobId,
      workerUserId: dispute.workerUserId,
      note: dispute.note,
      checkedInAt: iso(dispute.shift.checkedInAt),
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: iso(dispute.resolvedAt),
      resolvedByUserId: dispute.resolvedByUserId,
    };
  }

  async patchDispute(
    actorUserId: string,
    disputeId: string,
    body: AdminDisputePatchBody,
    requestId: string,
  ) {
    const existing = await this.prisma.checkInDispute.findUnique({
      where: { id: disputeId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Uyuşmazlık bulunamadı.',
      );
    }
    const updated = await this.prisma.checkInDispute.update({
      where: { id: disputeId },
      data: {
        status: body.status,
        resolvedAt: new Date(),
        resolvedByUserId: actorUserId,
      },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'dispute.status_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'check_in_dispute',
      resourceId: disputeId,
      requestId,
      metadata: { status: body.status },
    });
    return {
      id: updated.id,
      status: updated.status,
      shiftId: updated.shiftId,
    };
  }

  async listRatingsQueue(limit = 50) {
    const rows = await this.prisma.rating.findMany({
      where: { moderationStatus: 'queued' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        score: true,
        comment: true,
        moderationStatus: true,
        authorRole: true,
        shiftId: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
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
      items: rows.map((row) => ({
        id: row.id,
        documentType: row.documentType,
        status: row.status,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        fileName: row.fileName,
        workerName: [row.workerProfile.firstName, row.workerProfile.lastName]
          .filter(Boolean)
          .join(' '),
        workerUserId: row.workerProfile.userId,
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async getDocument(documentId: string) {
    const row = await this.prisma.workerDocument.findUnique({
      where: { id: documentId },
      include: { workerProfile: { include: { user: true } } },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Belge bulunamadı.',
      );
    }
    return {
      id: row.id,
      documentType: row.documentType,
      status: row.status,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      fileName: row.fileName,
      workerProfileId: row.workerProfileId,
      workerUserId: row.workerProfile.userId,
      workerName: [row.workerProfile.firstName, row.workerProfile.lastName]
        .filter(Boolean)
        .join(' '),
      uploadedAt: iso(row.uploadedAt),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async patchDocument(
    actorUserId: string,
    documentId: string,
    body: AdminDocumentPatchBody,
    requestId: string,
  ) {
    const existing = await this.prisma.workerDocument.findUnique({
      where: { id: documentId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Belge bulunamadı.',
      );
    }
    const updated = await this.prisma.workerDocument.update({
      where: { id: documentId },
      data: { status: body.status },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'document.status_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'worker_document',
      resourceId: documentId,
      requestId,
      metadata: { status: body.status },
    });
    return { id: updated.id, status: updated.status };
  }

  documentDownloadUrl(documentId: string) {
    return this.workerDocuments.adminDownloadUrl(documentId);
  }

  async listOutbox(limit = 50) {
    const rows = await this.prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        lastError: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
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
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        employerId: true,
        refType: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async revokeUserSessions(
    actorUserId: string,
    userId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Kullanıcı bulunamadı.',
      );
    }
    await this.sessions.revokeAllForUser(userId);
    await this.audit.append({
      category: 'admin_action',
      action: 'user.sessions_revoked',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'user',
      resourceId: userId,
      requestId,
    });
    return { id: userId, sessionsRevoked: true };
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

  async patchEmployerManager(
    actorUserId: string,
    employerId: string,
    managerUserId: string,
    body: AdminManagerPatchBody,
    requestId: string,
  ) {
    const scope = body.scope ?? (body.branchId ? 'branch' : 'workplace');
    switch (scope) {
      case 'workplace': {
        const row = await this.prisma.workplaceManager.findUnique({
          where: {
            userId_employerId: { userId: managerUserId, employerId },
          },
        });
        if (!row) {
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            ErrorCode.NOT_FOUND,
            'Yönetici bulunamadı.',
          );
        }
        const permissions = body.permissions
          ? parseManagerPermissions(body.permissions)
          : parseManagerPermissions(row.permissions);
        await this.prisma.workplaceManager.update({
          where: { id: row.id },
          data: {
            ...(body.status ? { status: body.status } : {}),
            ...(body.permissions ? { permissions } : {}),
          },
        });
        if (body.status === 'revoked') {
          await this.membership.revokeManagerContext(managerUserId, employerId);
        } else {
          await this.membership.syncManagerSessionPermissions(
            managerUserId,
            employerId,
            permissions,
          );
        }
        break;
      }
      case 'branch': {
        if (!body.branchId) {
          throw new ApiException(
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_FAILED,
            'Şube yöneticisi için branchId gerekli.',
          );
        }
        const row = await this.prisma.branchManager.findFirst({
          where: {
            userId: managerUserId,
            branchId: body.branchId,
            branch: { employerId },
          },
        });
        if (!row) {
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            ErrorCode.NOT_FOUND,
            'Yönetici bulunamadı.',
          );
        }
        const permissions = body.permissions
          ? parseManagerPermissions(body.permissions)
          : parseManagerPermissions(row.permissions);
        await this.prisma.branchManager.update({
          where: { id: row.id },
          data: {
            ...(body.status ? { status: body.status } : {}),
            ...(body.permissions ? { permissions } : {}),
          },
        });
        if (body.status === 'revoked') {
          await this.membership.revokeManagerContext(managerUserId, employerId);
        } else {
          await this.membership.syncManagerSessionPermissions(
            managerUserId,
            employerId,
            permissions,
          );
        }
        break;
      }
      default: {
        const _exhaustive: never = scope;
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          `Bilinmeyen kapsam: ${_exhaustive}`,
        );
      }
    }
    await this.audit.append({
      category: 'admin_action',
      action: 'employer.manager_permissions',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: {
        managerUserId,
        permissions: body.permissions,
        status: body.status,
        scope,
        branchId: body.branchId,
      },
    });
    return { ok: true };
  }

  async allocateEmployerTokens(
    actorUserId: string,
    employerId: string,
    body: AdminTokenAllocateBody,
    requestId: string,
  ) {
    const owner =
      body.ownerUserId ??
      (
        await this.prisma.employerMembership.findFirst({
          where: { employerId, role: 'owner', status: 'active' },
        })
      )?.userId;
    if (!owner) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşyeri sahibi bulunamadı.',
      );
    }
    const result = await this.tokens.allocate(owner, employerId, body);
    await this.audit.append({
      category: 'token_adjust',
      action: 'employer.token_allocate',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: {
        amount: body.amount,
        target: body.target,
        branchId: body.branchId,
      },
    });
    return result;
  }

  async resolveEmployerTokenRequest(
    actorUserId: string,
    employerId: string,
    requestId: string,
    body: AdminTokenRequestPatchBody,
    reqId: string,
  ) {
    const owner = await this.prisma.employerMembership.findFirst({
      where: { employerId, role: 'owner', status: 'active' },
    });
    if (!owner) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşyeri sahibi bulunamadı.',
      );
    }
    switch (body.action) {
      case 'approve':
      case 'reject':
        break;
      default: {
        const _exhaustive: never = body.action;
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          `Bilinmeyen işlem: ${_exhaustive}`,
        );
      }
    }
    const ctx = { role: 'employer' as const, employerId };
    const result = await this.tokens.resolveTokenRequest(
      owner.userId,
      ctx,
      requestId,
      body.action,
      body.amount,
    );
    await this.audit.append({
      category: 'token_adjust',
      action: `employer.token_request_${body.action}`,
      actorUserId,
      actorRole: 'admin',
      resourceType: 'token_request',
      resourceId: requestId,
      requestId: reqId,
      metadata: { employerId, amount: body.amount },
    });
    return result;
  }

  async matchingDiagnostics(jobId: string, workerUserId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { branch: true, employer: true },
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
        branchLatitude: Number(
          job.branch?.latitude ?? job.employer.latitude,
        ),
        branchLongitude: Number(
          job.branch?.longitude ?? job.employer.longitude,
        ),
      },
      {
        profile: worker,
        sectors: worker.sectors,
        occupations: worker.occupations,
        windows: worker.availability,
      },
      { favoredEmployerIds, uploadedDocumentTypes, timeZone },
    );
    return {
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      matchReasons: eligibility.matchReasons,
      distanceKm: eligibility.distanceKm,
      jobFavoritesOnly: job.favoritesOnly,
      workerNightShiftAvailable: worker.nightShiftAvailable,
      workerUploadedDocumentTypes: [...uploadedDocumentTypes],
    };
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

  private publicSmsSettings(row: {
    verimorEnabled: boolean;
    username: string;
    password: string;
    header: string;
  }) {
    return {
      verimorEnabled: row.verimorEnabled,
      username: row.username,
      header: row.header,
      passwordSet: row.password.length > 0,
      fallbackOtp: '290821' as const,
    };
  }

  async getSmsSettings() {
    const row = await this.prisma.smsSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    return this.publicSmsSettings(row);
  }

  async patchSmsSettings(
    actorUserId: string,
    body: AdminSmsSettingsBody,
    requestId: string,
  ) {
    const existing = await this.prisma.smsSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    const username = body.username.trim();
    const header = body.header.trim();
    const password =
      body.password !== undefined && body.password.length > 0
        ? body.password
        : existing.password;
    if (body.verimorEnabled && (!username || !password)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Verimor için kullanıcı adı ve şifre gerekli.',
      );
    }
    const updated = await this.prisma.smsSettings.update({
      where: { id: 'default' },
      data: {
        verimorEnabled: body.verimorEnabled,
        username,
        header,
        password,
      },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'config.sms_updated',
      actorUserId,
      actorRole: 'admin',
      requestId,
      metadata: {
        verimorEnabled: updated.verimorEnabled,
        username: updated.username,
        header: updated.header,
        passwordSet: updated.password.length > 0,
      },
    });
    return this.publicSmsSettings(updated);
  }

  private publicAdaptySettings(row: {
    enabled: boolean;
    publicSdkKey: string;
    secretKey: string;
    webhookAuthorization: string;
    placementId: string;
    appleStoreConnected: boolean;
    googleStoreConnected: boolean;
  }) {
    return {
      enabled: row.enabled,
      publicSdkKey: row.publicSdkKey,
      placementId: row.placementId,
      appleStoreConnected: row.appleStoreConnected,
      googleStoreConnected: row.googleStoreConnected,
      secretSet: row.secretKey.length > 0,
      webhookAuthorizationSet: row.webhookAuthorization.length > 0,
      webhookPath: '/api/v1/webhooks/adapty' as const,
    };
  }

  async getAdaptySettings() {
    const row = await this.prisma.adaptySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    return this.publicAdaptySettings(row);
  }

  async patchAdaptySettings(
    actorUserId: string,
    body: AdminAdaptySettingsBody,
    requestId: string,
  ) {
    const existing = await this.prisma.adaptySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    const publicSdkKey = body.publicSdkKey.trim();
    const placementId = body.placementId.trim();
    const secretKey =
      body.secretKey !== undefined && body.secretKey.length > 0
        ? body.secretKey
        : existing.secretKey;
    const webhookAuthorization =
      body.webhookAuthorization !== undefined &&
      body.webhookAuthorization.length > 0
        ? body.webhookAuthorization
        : existing.webhookAuthorization;
    if (body.enabled && (!publicSdkKey || !secretKey || !webhookAuthorization)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Adapty için public SDK key, secret ve webhook yetkisi gerekli.',
      );
    }
    const updated = await this.prisma.adaptySettings.update({
      where: { id: 'default' },
      data: {
        enabled: body.enabled,
        publicSdkKey,
        placementId,
        appleStoreConnected: body.appleStoreConnected,
        googleStoreConnected: body.googleStoreConnected,
        secretKey,
        webhookAuthorization,
      },
    });
    await this.audit.append({
      category: 'admin_action',
      action: 'config.adapty_updated',
      actorUserId,
      actorRole: 'admin',
      requestId,
      metadata: {
        enabled: updated.enabled,
        publicSdkKey: updated.publicSdkKey,
        placementId: updated.placementId,
        appleStoreConnected: updated.appleStoreConnected,
        googleStoreConnected: updated.googleStoreConnected,
        secretSet: updated.secretKey.length > 0,
        webhookAuthorizationSet: updated.webhookAuthorization.length > 0,
      },
    });
    return this.publicAdaptySettings(updated);
  }

  async listRiskEvents(limit = 50) {
    const rows = await this.prisma.riskEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        type: true,
        score: true,
        userId: true,
        shiftId: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async listAbuseReports(limit = 50) {
    const rows = await this.prisma.abuseReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        category: true,
        note: true,
        status: true,
        reporterUserId: true,
        targetUserId: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
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
      select: {
        id: true,
        legalName: true,
        taxId: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  listSubscriptionPlans() {
    return this.subscriptions.listPlans();
  }

  patchSubscriptionPlan(
    planId: string,
    body: Parameters<SubscriptionsService['patchPlan']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.subscriptions.patchPlan(planId, body, actorUserId, requestId);
  }

  patchEmployerSubscription(
    employerId: string,
    body: Parameters<SubscriptionsService['patchEmployerSubscription']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.subscriptions.patchEmployerSubscription(
      employerId,
      body,
      actorUserId,
      requestId,
    );
  }

  listSupportTickets(limit = 50, status?: string) {
    return this.support.listTicketsAdmin(limit, status);
  }

  getSupportTicket(ticketId: string) {
    return this.support.getTicketAdmin(ticketId);
  }

  replySupportTicket(
    ticketId: string,
    body: Parameters<SupportService['addStaffMessage']>[2],
    adminUserId: string,
    requestId: string,
  ) {
    return this.support.addStaffMessage(ticketId, adminUserId, body, requestId);
  }

  patchSupportTicket(
    ticketId: string,
    body: Parameters<SupportService['patchTicketAdmin']>[1],
    adminUserId: string,
    requestId: string,
  ) {
    return this.support.patchTicketAdmin(
      ticketId,
      body,
      adminUserId,
      requestId,
    );
  }

  listTokenPackages() {
    return this.tokenPackages.listAllAdmin();
  }

  createTokenPackage(
    body: Parameters<TokenPackagesService['createAdmin']>[0],
    actorUserId: string,
    requestId: string,
  ) {
    return this.tokenPackages.createAdmin(body, actorUserId, requestId);
  }

  patchTokenPackage(
    id: string,
    body: Parameters<TokenPackagesService['patchAdmin']>[1],
    actorUserId: string,
    requestId: string,
  ) {
    return this.tokenPackages.patchAdmin(id, body, actorUserId, requestId);
  }
}
