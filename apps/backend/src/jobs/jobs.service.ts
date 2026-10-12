import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type JobCreateBody,
  type JobPatchBody,
} from '@parton/api-contracts';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthContext } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { formatIstanbulDateTime } from '../common/istanbul-civil.js';
import { parseRequiredDocumentTypes } from '../common/parse-required-document-types.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import {
  decodeFeedCursor,
  encodeFeedCursor,
} from '../common/cursor.util.js';
import { FavoritesService } from '../favorites/favorites.service.js';
import { evaluateJobEligibility } from '../matching/matching.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PlatformService } from '../platform/platform.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { WorkerDocumentsService } from '../workers/worker-documents.service.js';
import { JobCatalogService } from '../job-catalog/job-catalog.service.js';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly config: AppConfigService,
    private readonly favorites: FavoritesService,
    private readonly workerDocuments: WorkerDocumentsService,
    private readonly notifications: NotificationsService,
    private readonly platform: PlatformService,
    private readonly catalog: JobCatalogService,
  ) {}

  private favoriteAudienceJobInput(
    employerId: string,
    branch: { latitude: Prisma.Decimal; longitude: Prisma.Decimal },
    job: {
      sectorCode: string;
      occupationCode: string | null | undefined;
      startsAt: Date;
      endsAt: Date;
      headcount: number;
      genderFilter: string | null | undefined;
      minAge: number | null | undefined;
      maxAge: number | null | undefined;
      requiredDocumentTypes: string[];
    },
  ) {
    return {
      id: 'audience-check',
      employerId,
      status: 'published',
      sectorCode: job.sectorCode,
      occupationCode: job.occupationCode ?? null,
      startsAt: job.startsAt,
      endsAt: job.endsAt,
      remainingHeadcount: job.headcount,
      favoritesOnly: true,
      genderFilter: job.genderFilter ?? null,
      minAge: job.minAge ?? null,
      maxAge: job.maxAge ?? null,
      requiredDocumentTypes: job.requiredDocumentTypes,
      branchLatitude: Number(branch.latitude),
      branchLongitude: Number(branch.longitude),
    };
  }

  private async collectEligibleFavoriteWorkerUserIds(
    employerId: string,
    branch: { latitude: Prisma.Decimal; longitude: Prisma.Decimal },
    job: {
      sectorCode: string;
      occupationCode: string | null | undefined;
      startsAt: Date;
      endsAt: Date;
      headcount: number;
      genderFilter: string | null | undefined;
      minAge: number | null | undefined;
      maxAge: number | null | undefined;
      requiredDocumentTypes: string[];
    },
  ): Promise<string[]> {
    const workerUserIds: string[] = [];
    let favoriteCursor: string | undefined;
    for (;;) {
      const favoriteRows = await this.prisma.favorite.findMany({
        where: {
          ownerEmployerId: employerId,
          targetKind: 'worker_user',
          ...(favoriteCursor ? { id: { gt: favoriteCursor } } : {}),
        },
        select: { id: true, targetId: true },
        orderBy: { id: 'asc' },
        take: 200,
      });
      if (favoriteRows.length === 0) {
        break;
      }
      favoriteCursor = favoriteRows.at(-1)?.id;
      for (const row of favoriteRows) {
        workerUserIds.push(row.targetId);
      }
      if (favoriteRows.length < 200) {
        break;
      }
    }
    if (workerUserIds.length === 0) {
      return [];
    }
    const profiles = await this.prisma.workerProfile.findMany({
      where: { userId: { in: workerUserIds } },
      include: {
        sectors: true,
        occupations: true,
        availability: true,
      },
    });
    const timeZone = await this.platform.timeZone();
    const favoredEmployerIds = new Set([employerId]);
    const candidateJob = this.favoriteAudienceJobInput(employerId, branch, job);
    const documentTypesByUser =
      await this.workerDocuments.uploadedTypesForUsers(
        profiles.map((profile) => profile.userId),
      );
    const eligible: string[] = [];
    for (const profile of profiles) {
      const uploadedDocumentTypes =
        documentTypesByUser.get(profile.userId) ?? new Set<string>();
      const result = evaluateJobEligibility(
        candidateJob,
        {
          profile,
          sectors: profile.sectors,
          occupations: profile.occupations,
          windows: profile.availability,
        },
        {
          favoredEmployerIds,
          uploadedDocumentTypes,
          timeZone,
        },
      );
      if (result.eligible) {
        eligible.push(profile.userId);
      }
    }
    return eligible;
  }

  private async countEligibleFavoriteAudience(
    employerId: string,
    branch: { latitude: Prisma.Decimal; longitude: Prisma.Decimal },
    job: {
      sectorCode: string;
      occupationCode: string | null | undefined;
      startsAt: Date;
      endsAt: Date;
      headcount: number;
      genderFilter: string | null | undefined;
      minAge: number | null | undefined;
      maxAge: number | null | undefined;
      requiredDocumentTypes: string[];
    },
  ): Promise<number> {
    const ids = await this.collectEligibleFavoriteWorkerUserIds(
      employerId,
      branch,
      job,
    );
    return ids.length;
  }

  private formatStartLocal(startsAt: Date, timeZone: string): string {
    return formatIstanbulDateTime(
      startsAt,
      {
        dateStyle: 'short',
        timeStyle: 'short',
      },
      timeZone,
    );
  }

  private async notifyWorkersAfterJobPublish(
    job: {
      id: string;
      employerId: string;
      title: string | null;
      startsAt: Date;
      endsAt: Date;
      sectorCode: string;
      occupationCode: string | null;
      headcount: number;
      remainingHeadcount: number;
      favoritesOnly: boolean;
      genderFilter: string | null;
      minAge: number | null;
      maxAge: number | null;
      requiredDocumentTypes: unknown;
      status: string;
    },
    employer: { legalName: string },
    branch: {
      latitude: Prisma.Decimal;
      longitude: Prisma.Decimal;
      city: string | null;
      name: string;
    },
  ) {
    const timeZone = await this.platform.timeZone();
    const branchArea = branch.city ?? branch.name;
    const startLocal = this.formatStartLocal(job.startsAt, timeZone);
    const jobTitle = job.title ?? 'İlan';

    if (job.favoritesOnly) {
      const workerUserIds = await this.collectEligibleFavoriteWorkerUserIds(
        job.employerId,
        branch,
        {
          sectorCode: job.sectorCode,
          occupationCode: job.occupationCode,
          startsAt: job.startsAt,
          endsAt: job.endsAt,
          headcount: job.headcount,
          genderFilter: job.genderFilter,
          minAge: job.minAge,
          maxAge: job.maxAge,
          requiredDocumentTypes: parseRequiredDocumentTypes(
            job.requiredDocumentTypes,
          ),
        },
      );
      if (workerUserIds.length === 0) {
        return;
      }
      await this.prisma.$transaction(async (tx) => {
        for (const workerUserId of workerUserIds) {
          await this.notifications.enqueueInTransaction(tx, {
            userId: workerUserId,
            type: 'job.favorites_only',
            dedupeKey: `job.favorites_only:${job.id}:${workerUserId}`,
            templateInput: {
              jobTitle,
              jobId: job.id,
              employerName: employer.legalName,
            },
            data: { jobId: job.id },
          });
        }
      });
      return;
    }

    const eligibilityJob = this.jobEligibilityInput({
      ...job,
      branch,
    });
    const matchedWorkerIds: string[] = [];
    const scannedUserIds: string[] = [];
    let profileCursor: string | undefined;
    for (;;) {
      const profiles = await this.prisma.workerProfile.findMany({
        where: {
          sectors: { some: { sectorCode: job.sectorCode } },
          ...(profileCursor ? { id: { gt: profileCursor } } : {}),
        },
        include: {
          sectors: true,
          occupations: true,
          availability: true,
        },
        orderBy: { id: 'asc' },
        take: 200,
      });
      if (profiles.length === 0) {
        break;
      }
      profileCursor = profiles.at(-1)?.id;
      const documentTypesByUser =
        await this.workerDocuments.uploadedTypesForUsers(
          profiles.map((profile) => profile.userId),
        );
      for (const profile of profiles) {
        scannedUserIds.push(profile.userId);
        const uploadedDocumentTypes =
          documentTypesByUser.get(profile.userId) ?? new Set<string>();
        const result = evaluateJobEligibility(
          eligibilityJob,
          {
            profile,
            sectors: profile.sectors,
            occupations: profile.occupations,
            windows: profile.availability,
          },
          {
            favoredEmployerIds: new Set<string>(),
            uploadedDocumentTypes,
            timeZone,
          },
        );
        if (result.eligible) {
          matchedWorkerIds.push(profile.userId);
        }
      }
      if (profiles.length < 200) {
        break;
      }
    }
    if (matchedWorkerIds.length === 0) {
      return;
    }

    const favoringEmployerRows = await this.prisma.favorite.findMany({
      where: {
        targetKind: 'employer',
        targetId: job.employerId,
        ownerUserId: { in: scannedUserIds },
      },
      select: { ownerUserId: true },
    });
    const favoriteEmployerWorkerIds = new Set(
      favoringEmployerRows.map((row) => row.ownerUserId),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const workerUserId of matchedWorkerIds) {
        await this.notifications.enqueueInTransaction(tx, {
          userId: workerUserId,
          type: 'job.matched',
          dedupeKey: `job.matched:${job.id}:${workerUserId}`,
          templateInput: {
            jobTitle,
            jobId: job.id,
            branchName: branchArea,
            startLocal,
          },
          data: { jobId: job.id },
        });
        if (favoriteEmployerWorkerIds.has(workerUserId)) {
          await this.notifications.enqueueInTransaction(tx, {
            userId: workerUserId,
            type: 'job.favorite_employer',
            dedupeKey: `job.favorite_employer:${job.id}:${workerUserId}`,
            templateInput: {
              jobTitle,
              jobId: job.id,
              employerName: employer.legalName,
            },
            data: { jobId: job.id },
          });
        }
      }
    });
  }

  private assertFavoritesAudienceForPublish(eligibleCount: number) {
    if (eligibleCount > 0) {
      return;
    }
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.FAVORITES_AUDIENCE_EMPTY,
      'Favori çalışan listenizde bu ilana uygun kimse yok.',
    );
  }

  private jobEligibilityInput(job: {
    id: string;
    employerId: string;
    status: string;
    sectorCode: string;
    occupationCode: string | null;
    startsAt: Date;
    endsAt: Date;
    remainingHeadcount: number;
    favoritesOnly: boolean;
    genderFilter: string | null;
    minAge: number | null;
    maxAge: number | null;
    requiredDocumentTypes: unknown;
    branch: { latitude: Prisma.Decimal; longitude: Prisma.Decimal };
  }) {
    return {
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
    };
  }

  private mapJob(job: {
    id: string;
    employerId: string;
    branchId: string;
    status: string;
    sectorCode: string;
    occupationCode: string | null;
    title: string | null;
    startsAt: Date;
    endsAt: Date;
    headcount: number;
    remainingHeadcount: number;
    payAmountMinor: number | null;
    payCurrency: string;
    favoritesOnly: boolean;
    genderFilter: string | null;
    minAge: number | null;
    maxAge: number | null;
    requiredDocumentTypes: unknown;
    amenities?: unknown;
    instantAutoApprove?: boolean;
    notes: string | null;
    publishedAt: Date | null;
    branch?: { name: string; latitude: unknown; longitude: unknown } | null;
  }) {
    const docs = Array.isArray(job.requiredDocumentTypes)
      ? (job.requiredDocumentTypes as string[])
      : [];
    const amenities = Array.isArray(job.amenities)
      ? (job.amenities as string[])
      : [];
    return {
      id: job.id,
      employerId: job.employerId,
      branchId: job.branchId,
      status: job.status as 'draft' | 'published' | 'closed',
      sectorCode: job.sectorCode,
      occupationCode: job.occupationCode,
      title: job.title,
      startsAt: job.startsAt.toISOString(),
      endsAt: job.endsAt.toISOString(),
      headcount: job.headcount,
      remainingHeadcount: job.remainingHeadcount,
      payAmountMinor: job.payAmountMinor,
      payCurrency: job.payCurrency,
      favoritesOnly: job.favoritesOnly,
      genderFilter: job.genderFilter,
      minAge: job.minAge,
      maxAge: job.maxAge,
      requiredDocumentTypes: docs,
      amenities,
      instantAutoApprove: job.instantAutoApprove ?? false,
      notes: job.notes,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      branchName: job.branch?.name,
      branchLatitude: job.branch ? Number(job.branch.latitude) : undefined,
      branchLongitude: job.branch ? Number(job.branch.longitude) : undefined,
    };
  }

  private assertAgeBounds(
    minAge: number | null | undefined,
    maxAge: number | null | undefined,
  ) {
    if (
      minAge != null &&
      maxAge != null &&
      minAge > maxAge
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Alt yaş üst yaştan büyük olamaz.',
      );
    }
  }

  private assertPublishAllowed(verificationStatus: string) {
    if (verificationStatus === 'verified' || verificationStatus === 'bypass') {
      return;
    }
    if (
      this.config.env.NODE_ENV === 'development' &&
      verificationStatus === 'pending'
    ) {
      return;
    }
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.EMPLOYER_UNVERIFIED,
      'İşveren doğrulaması tamamlanmadan ilan yayınlanamaz.',
    );
  }

  private validateSchedule(startsAt: Date, endsAt: Date) {
    const now = Date.now();
    if (startsAt.getTime() <= now) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'İlan başlangıcı gelecekte olmalıdır.',
      );
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Bitiş saati başlangıçtan sonra olmalıdır.',
      );
    }
  }

  private async assertBranchAccess(
    employerId: string,
    branchId: string,
    ctx: AuthContext,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, employerId, status: 'active' },
    });
    if (!branch) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Şube bulunamadı.',
      );
    }
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      if (!ctx.branchIds.includes(branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
    }
    return branch;
  }

  async createJob(
    userId: string,
    ctx: AuthContext,
    body: JobCreateBody,
    idempotencyKey?: string,
  ) {
    const employerId = ctx.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const branch = await this.assertBranchAccess(employerId, body.branchId, ctx);
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    this.validateSchedule(startsAt, endsAt);

    this.assertAgeBounds(body.minAge, body.maxAge);
    await this.catalog.assertActivePair(body.sectorCode, body.occupationCode);
    const publish = body.publish === true;
    const favoritesOnly = body.favoritesOnly ?? false;
    const requiredDocumentTypes = body.requiredDocumentTypes ?? [];
    if (publish) {
      this.assertPublishAllowed(employer.verificationStatus);
    }

    let eligibleFavoriteAudience = 0;
    if (favoritesOnly) {
      eligibleFavoriteAudience = await this.countEligibleFavoriteAudience(
        employerId,
        branch,
        {
          sectorCode: body.sectorCode,
          occupationCode: body.occupationCode,
          startsAt,
          endsAt,
          headcount: body.headcount,
          genderFilter: body.genderFilter,
          minAge: body.minAge,
          maxAge: body.maxAge,
          requiredDocumentTypes,
        },
      );
      if (publish) {
        this.assertFavoritesAudienceForPublish(eligibleFavoriteAudience);
      }
    }

    const job = await this.prisma.job.create({
      data: {
        employerId,
        branchId: body.branchId,
        status: publish ? 'published' : 'draft',
        sectorCode: body.sectorCode,
        occupationCode: body.occupationCode,
        title: body.title,
        startsAt,
        endsAt,
        headcount: body.headcount,
        remainingHeadcount: body.headcount,
        payAmountMinor: body.payAmountMinor,
        payCurrency: body.payCurrency ?? 'TRY',
        favoritesOnly,
        genderFilter: body.genderFilter,
        minAge: body.minAge,
        maxAge: body.maxAge,
        requiredDocumentTypes,
        amenities: body.amenities ?? [],
        instantAutoApprove: body.instantAutoApprove ?? false,
        notes: body.notes,
        publishedAt: publish ? new Date() : null,
      },
    });

    if (publish) {
      await this.tokens.holdForJob(
        employerId,
        job.id,
        body.headcount,
        idempotencyKey,
      );
      await this.notifyWorkersAfterJobPublish(
        job,
        { legalName: employer.legalName },
        branch,
      );
    } else if (favoritesOnly && eligibleFavoriteAudience === 0) {
      await this.prisma.$transaction(async (tx) => {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'job.audience_empty',
          dedupeKey: `job.audience_empty:${job.id}`,
          templateInput: { jobTitle: body.title ?? 'İlan', jobId: job.id },
          data: { jobId: job.id },
        });
      });
    }

    return this.mapJob(job);
  }

  async listEmployerJobs(ctx: AuthContext) {
    const employerId = ctx.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const where: Prisma.JobWhereInput = { employerId };
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      where.branchId = { in: ctx.branchIds };
    }
    const jobs = await this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { branch: true },
    });
    return { items: jobs.map((j) => this.mapJob(j)) };
  }

  async getJobForUser(userId: string, ctx: AuthContext | undefined, jobId: string) {
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

    const base = this.mapJob(job);
    const detail = {
      ...base,
      branchName: job.branch.name,
      branchCity: job.branch.city,
      branchLatitude: Number(job.branch.latitude),
      branchLongitude: Number(job.branch.longitude),
    };

    if (ctx?.role === 'employer' || ctx?.role === 'manager') {
      if (ctx.employerId && job.employerId !== ctx.employerId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu ilana erişiminiz yok.',
        );
      }
      return detail;
    }

    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
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

    const employerIds = [job.employerId];
    const favoredEmployerIds =
      await this.favorites.favoredEmployerIdsForWorker(userId, employerIds);
    if (job.favoritesOnly && !favoredEmployerIds.has(job.employerId)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    const uploadedDocumentTypes =
      await this.workerDocuments.uploadedTypesForUser(userId);
    const timeZone = await this.platform.timeZone();

    const eligibility = evaluateJobEligibility(
      this.jobEligibilityInput({ ...job, branch: job.branch }),
      {
        profile: worker,
        sectors: worker.sectors,
        occupations: worker.occupations,
        windows: worker.availability,
      },
      { favoredEmployerIds, uploadedDocumentTypes, timeZone },
    );

    return {
      ...detail,
      distanceKm: eligibility.distanceKm,
      matchReasons: eligibility.matchReasons,
      eligibility: {
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
      },
    };
  }

  async patchJob(
    ctx: AuthContext,
    jobId: string,
    body: JobPatchBody,
    idempotencyKey?: string,
  ) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İlan bulunamadı.',
      );
    }
    if (ctx.employerId !== job.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu ilana erişiminiz yok.',
      );
    }

    this.assertAgeBounds(body.minAge ?? job.minAge, body.maxAge ?? job.maxAge);
    if (body.sectorCode || body.occupationCode) {
      await this.catalog.assertActivePair(
        body.sectorCode ?? job.sectorCode,
        body.occupationCode ?? job.occupationCode,
      );
    }
    const startsAt = body.startsAt ? new Date(body.startsAt) : job.startsAt;
    const endsAt = body.endsAt ? new Date(body.endsAt) : job.endsAt;
    if (body.startsAt || body.endsAt) {
      this.validateSchedule(startsAt, endsAt);
    }

    let status = body.status ?? job.status;
    let publishedAt = job.publishedAt;
    if (body.status === 'published' && job.status === 'draft') {
      const employer = await this.prisma.employer.findUnique({
        where: { id: job.employerId },
      });
      if (!employer) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'İşveren bulunamadı.',
        );
      }
      this.assertPublishAllowed(employer.verificationStatus);
      const favoritesOnly = body.favoritesOnly ?? job.favoritesOnly;
      if (favoritesOnly) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: job.branchId, employerId: job.employerId },
        });
        if (!branch) {
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            ErrorCode.NOT_FOUND,
            'Şube bulunamadı.',
          );
        }
        const docs = body.requiredDocumentTypes ??
          parseRequiredDocumentTypes(job.requiredDocumentTypes);
        const eligible = await this.countEligibleFavoriteAudience(
          job.employerId,
          branch,
          {
            sectorCode: body.sectorCode ?? job.sectorCode,
            occupationCode: body.occupationCode ?? job.occupationCode,
            startsAt,
            endsAt,
            headcount: body.headcount ?? job.headcount,
            genderFilter: body.genderFilter ?? job.genderFilter,
            minAge: body.minAge ?? job.minAge,
            maxAge: body.maxAge ?? job.maxAge,
            requiredDocumentTypes: docs,
          },
        );
        this.assertFavoritesAudienceForPublish(eligible);
      }
      publishedAt = new Date();
      await this.tokens.holdForJob(
        job.employerId,
        job.id,
        body.headcount ?? job.headcount,
        idempotencyKey,
      );
    }
    if (body.status === 'closed' && job.status === 'published') {
      await this.tokens.releaseHold(job.id, 'close', idempotencyKey);
      status = 'closed';
    }

    const headcount = body.headcount ?? job.headcount;
    let remainingHeadcount = job.remainingHeadcount;
    if (
      job.status === 'published' &&
      body.headcount !== undefined &&
      body.headcount !== job.headcount
    ) {
      const filledSeats = job.headcount - job.remainingHeadcount;
      if (headcount < filledSeats) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          'Personel sayısı onaylanan başvuruların altına düşürülemez.',
        );
      }
      await this.tokens.adjustHoldForJob(
        job.employerId,
        job.id,
        job.headcount,
        headcount,
        idempotencyKey ? `${idempotencyKey}:hold-adjust` : undefined,
      );
      remainingHeadcount = job.remainingHeadcount + (headcount - job.headcount);
    } else if (status === 'published' && job.status === 'draft') {
      remainingHeadcount = headcount;
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        sectorCode: body.sectorCode,
        occupationCode: body.occupationCode,
        title: body.title,
        startsAt,
        endsAt,
        headcount,
        remainingHeadcount,
        payAmountMinor: body.payAmountMinor,
        payCurrency: body.payCurrency,
        favoritesOnly: body.favoritesOnly,
        genderFilter: body.genderFilter,
        minAge: body.minAge,
        maxAge: body.maxAge,
        requiredDocumentTypes: body.requiredDocumentTypes,
        amenities: body.amenities,
        instantAutoApprove: body.instantAutoApprove,
        notes: body.notes,
        status,
        publishedAt,
      },
    });
    if (body.status === 'published' && job.status === 'draft') {
      const employer = await this.prisma.employer.findUnique({
        where: { id: job.employerId },
      });
      const branch = await this.prisma.branch.findFirst({
        where: { id: job.branchId, employerId: job.employerId },
      });
      if (employer && branch) {
        await this.notifyWorkersAfterJobPublish(
          updated,
          { legalName: employer.legalName },
          branch,
        );
      }
    }
    return this.mapJob(updated);
  }

  async workerFeed(
    userId: string,
    limit: number,
    cursorRaw?: string,
    filters?: {
      sectorCode?: string;
      occupationCode?: string;
      onlyFavorites?: boolean;
      onlyInstantApproval?: boolean;
    },
  ) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
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

    const limitClamped = Math.min(Math.max(limit, 1), 50);
    const cursor = decodeFeedCursor(cursorRaw);

    const timeZone = await this.platform.timeZone();
    const sectorCodes = worker.sectors.map((s) => s.sectorCode);
    if (sectorCodes.length === 0) {
      return {
        items: [],
        nextCursor: null,
        limit: limitClamped,
      };
    }

    const favoredRows: { ownerEmployerId: string | null }[] = [];
    let favoredCursor: string | undefined;
    for (;;) {
      const page = await this.prisma.favorite.findMany({
        where: {
          targetKind: 'worker_user',
          targetId: userId,
          ...(favoredCursor ? { id: { gt: favoredCursor } } : {}),
        },
        select: { id: true, ownerEmployerId: true },
        orderBy: { id: 'asc' },
        take: 200,
      });
      if (page.length === 0) {
        break;
      }
      favoredCursor = page.at(-1)?.id;
      favoredRows.push(...page);
      if (page.length < 200) {
        break;
      }
    }
    const favoredEmployerIdList = favoredRows
      .map((row) => row.ownerEmployerId)
      .filter((id): id is string => Boolean(id));

    const favoritesVisibility: Prisma.JobWhereInput =
      favoredEmployerIdList.length > 0
        ? {
            OR: [
              { favoritesOnly: false },
              {
                favoritesOnly: true,
                employerId: { in: favoredEmployerIdList },
              },
            ],
          }
        : { favoritesOnly: false };

    const uploadedDocumentTypes =
      await this.workerDocuments.uploadedTypesForUser(userId);

    const workerFavoredEmployerIds = filters?.onlyFavorites
      ? new Set(
          (
            await this.prisma.favorite.findMany({
              where: { ownerUserId: userId, targetKind: 'employer' },
              select: { targetId: true },
            })
          ).map((row) => row.targetId),
        )
      : null;

    type JobWithBranch = Prisma.JobGetPayload<{
      include: { branch: true };
    }>;

    const scored: Array<{
      job: JobWithBranch;
      eligibility: ReturnType<typeof evaluateJobEligibility>;
    }> = [];
    const BATCH = 200;
    let lastKey: { startsAt: Date; id: string } | null = null;
    let startIndex = 0;

    for (;;) {
      const keysetFilter: Prisma.JobWhereInput = lastKey
        ? {
            OR: [
              { startsAt: { gt: lastKey.startsAt } },
              { startsAt: lastKey.startsAt, id: { gt: lastKey.id } },
            ],
          }
        : {};

      const jobs = await this.prisma.job.findMany({
        where: {
          status: 'published',
          remainingHeadcount: { gt: 0 },
          startsAt: { gt: new Date() },
          sectorCode: filters?.sectorCode
            ? filters.sectorCode
            : { in: sectorCodes },
          ...(filters?.occupationCode
            ? { occupationCode: filters.occupationCode }
            : {}),
          ...(filters?.onlyInstantApproval
            ? { instantAutoApprove: true }
            : {}),
          AND: [favoritesVisibility, keysetFilter],
        },
        include: { branch: true },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: BATCH,
      });

      if (jobs.length === 0) {
        break;
      }

      const lastJob = jobs.at(-1);
      if (lastJob) {
        lastKey = { startsAt: lastJob.startsAt, id: lastJob.id };
      }

      const employerIds = [...new Set(jobs.map((j) => j.employerId))];
      const favoredEmployerIds =
        await this.favorites.favoredEmployerIdsForWorker(userId, employerIds);
      const matchingContext = {
        favoredEmployerIds,
        uploadedDocumentTypes,
        timeZone,
      };

      for (const job of jobs) {
        const eligibility = evaluateJobEligibility(
          this.jobEligibilityInput(job),
          {
            profile: worker,
            sectors: worker.sectors,
            occupations: worker.occupations,
            windows: worker.availability,
          },
          matchingContext,
        );
        if (eligibility.eligible) {
          if (
            workerFavoredEmployerIds &&
            !workerFavoredEmployerIds.has(job.employerId)
          ) {
            continue;
          }
          scored.push({ job, eligibility });
        }
      }

      if (jobs.length < BATCH) {
        break;
      }
    }

    scored.sort((a, b) => {
      const da = a.eligibility.distanceKm ?? 9999;
      const db = b.eligibility.distanceKm ?? 9999;
      return da - db;
    });

    if (cursor) {
      const idx = scored.findIndex((row) => row.job.id === cursor.id);
      startIndex = idx >= 0 ? idx + 1 : 0;
    }

    const page = scored.slice(startIndex, startIndex + limitClamped);
    const hasMore = startIndex + limitClamped < scored.length;
    const last = page.at(-1);

    return {
      items: page.map(({ job, eligibility }) => ({
        ...this.mapJob(job),
        branchName: job.branch.name,
        branchCity: job.branch.city,
        branchLatitude: Number(job.branch.latitude),
        branchLongitude: Number(job.branch.longitude),
        distanceKm: eligibility.distanceKm,
        matchReasons: eligibility.matchReasons,
        eligibility: {
          eligible: true,
          reasons: [],
        },
      })),
      nextCursor:
        hasMore && last
          ? encodeFeedCursor({
              startsAt: last.job.startsAt.toISOString(),
              id: last.job.id,
            })
          : null,
      limit: limitClamped,
    };
  }
}
