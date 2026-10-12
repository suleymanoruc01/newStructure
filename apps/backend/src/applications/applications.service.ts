import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  ApplicationApplyBody,
  ApplicationStatus,
  AuthContext,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { formatIstanbulDateTime } from '../common/istanbul-civil.js';
import { AppConfigService } from '../config/app-config.service.js';
import { parseRequiredDocumentTypes } from '../common/parse-required-document-types.util.js';
import { FavoritesService } from '../favorites/favorites.service.js';
import { evaluateJobEligibility } from '../matching/matching.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PlatformService } from '../platform/platform.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { WorkerDocumentsService } from '../workers/worker-documents.service.js';
import {
  buildProfileSnapshot,
  workerDisplayName,
} from './application-snapshot.util.js';
import { intervalsOverlap } from './overlap.util.js';

const ACTIVE_OVERLAP_STATUSES: ApplicationStatus[] = ['pending', 'accepted'];

function jsonStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly tokens: TokensService,
    private readonly shifts: ShiftsService,
    private readonly favorites: FavoritesService,
    private readonly workerDocuments: WorkerDocumentsService,
    private readonly config: AppConfigService,
    private readonly platform: PlatformService,
  ) {}

  private mapApplication(row: {
    id: string;
    jobId: string;
    workerUserId: string;
    status: string;
    profileSnapshot: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const snapshot = row.profileSnapshot as Record<string, unknown>;
    return {
      id: row.id,
      jobId: row.jobId,
      workerUserId: row.workerUserId,
      status: row.status as ApplicationStatus,
      profileSnapshot: {
        firstName: (snapshot.firstName as string | null) ?? null,
        lastName: (snapshot.lastName as string | null) ?? null,
        birthDate: (snapshot.birthDate as string | null) ?? null,
        gender: (snapshot.gender as string | null) ?? null,
        sectorCodes: Array.isArray(snapshot.sectorCodes)
          ? (snapshot.sectorCodes as string[])
          : [],
        occupationCodes: Array.isArray(snapshot.occupationCodes)
          ? (snapshot.occupationCodes as string[])
          : [],
        capturedAt: String(snapshot.capturedAt ?? row.createdAt.toISOString()),
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private assertTransition(
    current: ApplicationStatus,
    allowed: ApplicationStatus[],
  ) {
    if (!allowed.includes(current)) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.APPLICATION_INVALID_STATE,
        'Bu başvuru için işlem yapılamaz.',
      );
    }
  }

  async applyToJob(
    workerUserId: string,
    jobId: string,
    body: ApplicationApplyBody,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const prior = await this.prisma.application.findUnique({
        where: { idempotencyKey },
      });
      if (prior) {
        return { application: this.mapApplication(prior) };
      }
    }

    const windowStart = new Date(
      Date.now() - this.config.env.APPLY_RATE_WINDOW_MS,
    );
    const recentApplies = await this.prisma.application.count({
      where: {
        workerUserId,
        createdAt: { gte: windowStart },
      },
    });
    if (recentApplies >= this.config.env.APPLY_RATE_LIMIT) {
      await this.prisma.riskEvent.create({
        data: {
          userId: workerUserId,
          type: 'bot_apply',
          score: 3,
          metadata: {
            recentApplies,
            windowMs: this.config.env.APPLY_RATE_WINDOW_MS,
          },
        },
      });
      throw new ApiException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMITED,
        'Çok fazla başvuru. Lütfen bekleyin.',
      );
    }

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
      include: {
        sectors: true,
        occupations: true,
        availability: true,
      },
    });
    if (!worker) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İş arayan profili gerekli.',
      );
    }

    const favoredEmployerIds =
      await this.favorites.favoredEmployerIdsForWorker(workerUserId, [
        job.employerId,
      ]);
    if (job.favoritesOnly && !favoredEmployerIds.has(job.employerId)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    const uploadedDocumentTypes =
      await this.workerDocuments.uploadedTypesForUser(workerUserId);
    const timeZone = await this.platform.timeZone();

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
        requiredDocumentTypes: parseRequiredDocumentTypes(
          job.requiredDocumentTypes,
        ),
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
    if (!eligibility.eligible) {
      if (eligibility.reasons.includes('profile_incomplete')) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.PROFILE_INCOMPLETE,
          'Profiliniz tamamlanmadan başvuru yapılamaz.',
        );
      }
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.JOB_NOT_APPLICABLE,
        'Bu ilana başvuru yapılamaz.',
      );
    }

    const existing = await this.prisma.application.findUnique({
      where: { jobId_workerUserId: { jobId, workerUserId } },
    });
    if (existing) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.ALREADY_APPLIED,
        'Bu ilana zaten başvurdunuz.',
      );
    }

    const overlaps = await this.findScheduleOverlaps(
      workerUserId,
      job.startsAt,
      job.endsAt,
    );
    if (overlaps.length > 0 && !body.acknowledgeOverlap) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.SCHEDULE_OVERLAP_WARN,
        'Başka bir başvurunuzla saat çakışması var. Onaylayarak devam edebilirsiniz.',
        overlaps.map((o) => ({
          code: 'overlap',
          path: o.applicationId,
          jobId: o.jobId,
          startsAt: o.startsAt,
          endsAt: o.endsAt,
        })),
      );
    }

    const snapshot = buildProfileSnapshot(worker);

    const application = await this.prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          jobId,
          workerUserId,
          workerProfileId: worker.id,
          status: 'pending',
          profileSnapshot: snapshot,
          idempotencyKey,
        },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId: created.id,
          eventType: 'submitted',
          actorUserId: workerUserId,
        },
      });

      const audience = await this.resolveEmployerAudience(
        job.employerId,
        job.branchId,
      );
      const displayName = workerDisplayName(snapshot);
      const jobTitle = job.title ?? job.sectorCode;
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'application.received',
          dedupeKey: `application.received:${created.id}:${userId}`,
          templateInput: {
            workerDisplayName: displayName,
            jobTitle,
          },
          data: {
            applicationId: created.id,
            jobId: job.id,
          },
        });
      }

      return created;
    });

    if (job.instantAutoApprove) {
      const owner = await this.prisma.employerMembership.findFirst({
        where: {
          employerId: job.employerId,
          role: 'owner',
          status: 'active',
        },
      });
      if (owner) {
        try {
          const accepted = await this.accept(
            owner.userId,
            { role: 'employer', employerId: job.employerId },
            application.id,
          );
          return {
            application: accepted,
            overlapWarnings: overlaps.length > 0 ? overlaps : undefined,
          };
        } catch {
          // Instant approve is best-effort; leave pending if overlap/headcount blocks.
        }
      }
    }

    return {
      application: this.mapApplication(application),
      overlapWarnings: overlaps.length > 0 ? overlaps : undefined,
    };
  }

  async listMine(workerUserId: string, status?: ApplicationStatus) {
    const where = {
      workerUserId,
      ...(status ? { status } : {}),
    };
    const rows = await this.prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { job: { include: { branch: true } } },
    });
    return {
      items: rows.map((row) => ({
        ...this.mapApplication(row),
        jobTitle: row.job.title,
        jobStartsAt: row.job.startsAt.toISOString(),
        jobEndsAt: row.job.endsAt.toISOString(),
        branchName: row.job.branch.name,
        payAmountMinor: row.job.payAmountMinor,
        payCurrency: row.job.payCurrency,
        amenities: jsonStrings(row.job.amenities),
      })),
    };
  }

  async listForJob(ctx: AuthContext, jobId: string, status?: ApplicationStatus) {
    const job = await this.assertJobAccess(ctx, jobId);
    const rows = await this.prisma.application.findMany({
      where: {
        jobId: job.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((row) => ({
        ...this.mapApplication(row),
        workerDisplayName: workerDisplayName(
          this.mapApplication(row).profileSnapshot,
        ),
      })),
    };
  }

  async getOne(userId: string, ctx: AuthContext | undefined, id: string) {
    const row = await this.prisma.application.findUnique({
      where: { id },
      include: { job: { include: { branch: true } } },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    if (ctx?.role === 'worker') {
      if (row.workerUserId !== userId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu başvuruya erişiminiz yok.',
        );
      }
    } else if (ctx?.role === 'employer' || ctx?.role === 'manager') {
      await this.assertJobAccess(ctx, row.jobId);
    } else {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu başvuruya erişiminiz yok.',
      );
    }
    return {
      ...this.mapApplication(row),
      jobTitle: row.job.title,
      jobStartsAt: row.job.startsAt.toISOString(),
      jobEndsAt: row.job.endsAt.toISOString(),
      branchName: row.job.branch.name,
      payAmountMinor: row.job.payAmountMinor,
      payCurrency: row.job.payCurrency,
      amenities: jsonStrings(row.job.amenities),
    };
  }

  async withdraw(workerUserId: string, applicationId: string) {
    const row = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!row || row.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    this.assertTransition(row.status as ApplicationStatus, ['pending']);
    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'withdrawn' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'withdrawn',
          actorUserId: workerUserId,
        },
      });
      return app;
    });
    return this.mapApplication(updated);
  }

  async accept(
    actorUserId: string,
    ctx: AuthContext,
    applicationId: string,
    idempotencyKey?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { include: { branch: true } } },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    await this.assertJobAccess(ctx, application.jobId);
    this.assertTransition(application.status as ApplicationStatus, [
      'pending',
      'substitute',
    ]);

    const overlapAccepted = await this.findAcceptedOverlaps(
      application.workerUserId,
      application.job.startsAt,
      application.job.endsAt,
      application.id,
    );
    if (overlapAccepted.length > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.SCHEDULE_OVERLAP_BLOCK,
        'İşçinin onaylı başka bir vardiyası ile saat çakışıyor.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: application.jobId } });
      if (!job || job.remainingHeadcount <= 0) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.JOB_NOT_APPLICABLE,
          'Kontenjan dolu.',
        );
      }

      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'accepted' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'accepted',
          actorUserId,
        },
      });

      const remaining = job.remainingHeadcount - 1;
      let jobStatus = job.status;
      if (remaining <= 0) {
        jobStatus = 'closed';
      }
      await tx.job.update({
        where: { id: job.id },
        data: {
          remainingHeadcount: remaining,
          status: jobStatus,
        },
      });

      await this.shifts.createForAcceptedApplication(tx, {
        applicationId: app.id,
        jobId: job.id,
        workerUserId: application.workerUserId,
        employerId: job.employerId,
        branchId: job.branchId,
        startsAt: job.startsAt,
        endsAt: job.endsAt,
      });

      const startLocal = formatIstanbulDateTime(
        application.job.startsAt,
        {},
        await this.platform.timeZone(),
      );
      await this.notifications.enqueueInTransaction(tx, {
        userId: application.workerUserId,
        type: 'application.accepted',
        dedupeKey: `application.accepted:${applicationId}`,
        templateInput: {
          jobTitle: application.job.title ?? application.job.sectorCode,
          branchName: application.job.branch.name,
          startLocal,
        },
        data: {
          applicationId,
          jobId: application.jobId,
        },
      });

      if (jobStatus === 'closed') {
        await this.notifications.enqueueInTransaction(tx, {
          userId: application.workerUserId,
          type: 'job.closed_with_accepts',
          dedupeKey: `job.closed_with_accepts:${job.id}:${application.workerUserId}`,
          templateInput: {
            jobTitle: application.job.title ?? application.job.sectorCode,
          },
          data: { jobId: job.id, applicationId },
        });
      }

      return app;
    });

    const jobAfter = await this.prisma.job.findUnique({
      where: { id: application.jobId },
    });
    if (jobAfter?.status === 'closed') {
      await this.tokens.releaseHold(application.jobId, 'close', idempotencyKey);
    }

    return this.mapApplication(updated);
  }

  async reject(actorUserId: string, ctx: AuthContext, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { include: { branch: true } } },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    await this.assertJobAccess(ctx, application.jobId);
    this.assertTransition(application.status as ApplicationStatus, [
      'pending',
      'substitute',
    ]);

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'rejected' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'rejected',
          actorUserId,
        },
      });
      await this.notifications.enqueueInTransaction(tx, {
        userId: application.workerUserId,
        type: 'application.rejected',
        dedupeKey: `application.rejected:${applicationId}`,
        templateInput: {
          jobTitle: application.job.title ?? application.job.sectorCode,
        },
        data: { applicationId, jobId: application.jobId },
      });
      return app;
    });
    return this.mapApplication(updated);
  }

  async moveToSubstitute(
    actorUserId: string,
    ctx: AuthContext,
    applicationId: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    await this.assertJobAccess(ctx, application.jobId);
    this.assertTransition(application.status as ApplicationStatus, ['pending']);
    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'substitute' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'substitute',
          actorUserId,
        },
      });
      return app;
    });
    return this.mapApplication(updated);
  }

  async removeSubstitute(
    actorUserId: string,
    ctx: AuthContext,
    applicationId: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    await this.assertJobAccess(ctx, application.jobId);
    this.assertTransition(application.status as ApplicationStatus, [
      'substitute',
    ]);
    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'pending' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'substitute_removed',
          actorUserId,
        },
      });
      return app;
    });
    return this.mapApplication(updated);
  }

  async revokeAccept(
    actorUserId: string,
    ctx: AuthContext,
    applicationId: string,
    idempotencyKey?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { include: { branch: true } } },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    await this.assertJobAccess(ctx, application.jobId);
    this.assertTransition(application.status as ApplicationStatus, ['accepted']);

    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: application.jobId } });
      if (!job) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'İlan bulunamadı.',
        );
      }
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: 'accept_revoked' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: 'accept_revoked',
          actorUserId,
        },
      });

      const remaining = job.remainingHeadcount + 1;
      const status =
        job.status === 'closed' && remaining > 0 ? 'published' : job.status;
      await tx.job.update({
        where: { id: job.id },
        data: {
          remainingHeadcount: Math.min(job.headcount, remaining),
          status,
        },
      });

      await this.notifications.enqueueInTransaction(tx, {
        userId: application.workerUserId,
        type: 'application.accept_revoked',
        dedupeKey: `application.accept_revoked:${applicationId}`,
        templateInput: {
          jobTitle: application.job.title ?? application.job.sectorCode,
        },
        data: { applicationId, jobId: application.jobId },
      });
      return app;
    });

    const jobAfter = await this.prisma.job.findUnique({
      where: { id: application.jobId },
    });
    if (jobAfter?.status === 'published' && application.job.status === 'closed') {
      await this.tokens.holdForJob(
        application.job.employerId,
        application.jobId,
        jobAfter.headcount,
        idempotencyKey,
      );
    }

    return this.mapApplication(updated);
  }

  async adminOverrideStatus(
    actorUserId: string,
    applicationId: string,
    targetStatus: 'rejected' | 'accepted' | 'accept_revoked' | 'withdrawn',
    requestId: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Başvuru bulunamadı.',
      );
    }
    const employerCtx: AuthContext = {
      role: 'employer',
      employerId: application.job.employerId,
    };
    const idempotencyKey = `admin-app:${applicationId}:${requestId}`;

    switch (targetStatus) {
      case 'rejected':
        return this.reject(actorUserId, employerCtx, applicationId);
      case 'accepted':
        return this.accept(
          actorUserId,
          employerCtx,
          applicationId,
          idempotencyKey,
        );
      case 'accept_revoked':
        return this.revokeAccept(
          actorUserId,
          employerCtx,
          applicationId,
          idempotencyKey,
        );
      case 'withdrawn': {
        this.assertTransition(application.status as ApplicationStatus, [
          'pending',
        ]);
        const updated = await this.prisma.$transaction(async (tx) => {
          const app = await tx.application.update({
            where: { id: applicationId },
            data: { status: 'withdrawn' },
          });
          await tx.applicationEvent.create({
            data: {
              applicationId,
              eventType: 'withdrawn',
              actorUserId,
              metadata: { via: 'admin' },
            },
          });
          return app;
        });
        return this.mapApplication(updated);
      }
      default: {
        const _exhaustive: never = targetStatus;
        throw _exhaustive;
      }
    }
  }

  private async assertJobAccess(ctx: AuthContext, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    if (!ctx.employerId || job.employerId !== ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu ilana erişiminiz yok.',
      );
    }
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      if (!ctx.branchIds.includes(job.branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
    }
    return job;
  }

  private async resolveEmployerAudience(employerId: string, branchId: string) {
    const memberships = await this.prisma.employerMembership.findMany({
      where: { employerId, status: 'active' },
      select: { userId: true },
    });
    const managers = await this.prisma.branchManager.findMany({
      where: { branchId, status: 'active' },
      select: { userId: true },
    });
    const ids = new Set<string>();
    for (const m of memberships) {
      ids.add(m.userId);
    }
    for (const m of managers) {
      ids.add(m.userId);
    }
    return [...ids];
  }

  private async findScheduleOverlaps(
    workerUserId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const rows = await this.prisma.application.findMany({
      where: {
        workerUserId,
        status: { in: ACTIVE_OVERLAP_STATUSES },
      },
      include: { job: true },
    });
    return rows
      .filter((row) =>
        intervalsOverlap(startsAt, endsAt, row.job.startsAt, row.job.endsAt),
      )
      .map((row) => ({
        applicationId: row.id,
        jobId: row.jobId,
        startsAt: row.job.startsAt.toISOString(),
        endsAt: row.job.endsAt.toISOString(),
        status: row.status as ApplicationStatus,
      }));
  }

  private async findAcceptedOverlaps(
    workerUserId: string,
    startsAt: Date,
    endsAt: Date,
    excludeApplicationId: string,
  ) {
    const rows = await this.prisma.application.findMany({
      where: {
        workerUserId,
        status: 'accepted',
        id: { not: excludeApplicationId },
      },
      include: { job: true },
    });
    return rows.filter((row) =>
      intervalsOverlap(startsAt, endsAt, row.job.startsAt, row.job.endsAt),
    );
  }
}
