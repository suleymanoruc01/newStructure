import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  AvailabilityConfirmBody,
  AvailabilityDecision,
  CheckInBody,
  CheckOutBody,
  DisputeCreateBody,
  ShiftIncidentCreateBody,
  ShiftStatus,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';
import type { Prisma } from '../generated/prisma/client.js';

import { ApiException } from '../common/api.exception.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import { GeofenceService } from '../location/geofence.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PlatformService } from '../platform/platform.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { jobSiteFrom, requireJobSite } from '../common/job-location.js';
import { computeCandidateScore } from '../applications/candidate-ranking.util.js';
import { resolveEmployerAudience } from './shift-notify.util.js';
import {
  computeConfirmWindow,
  isCheckInWindowOpen,
  isConfirmWindowOpen,
} from './shift-timing.util.js';

type Tx = Prisma.TransactionClient;

function jsonStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseInstant(raw: string | undefined, field: string): Date | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      `${field} geçersiz.`,
    );
  }
  return date;
}

function startsAtWhere(
  from?: string,
  to?: string,
): Prisma.DateTimeFilter | undefined {
  const gte = parseInstant(from, 'from');
  const lt = parseInstant(to, 'to');
  if (!gte && !lt) {
    return undefined;
  }
  return {
    ...(gte ? { gte } : {}),
    ...(lt ? { lt } : {}),
  };
}

function profileDisplayName(
  profile:
    | { firstName: string | null; lastName: string | null }
    | null
    | undefined,
): string | null {
  if (!profile) {
    return null;
  }
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  return name || null;
}

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
    private readonly geofence: GeofenceService,
    private readonly tokens: TokensService,
    private readonly ratings: RatingsService,
    private readonly platform: PlatformService,
  ) {}

  async createForAcceptedApplication(
    tx: Tx,
    params: {
      applicationId: string;
      jobId: string;
      workerUserId: string;
      employerId: string;
      branchId: string | null;
      startsAt: Date;
      endsAt: Date;
    },
  ) {
    const { confirmOpensAt, confirmDeadlineAt } = computeConfirmWindow(
      params.startsAt,
      this.config.env.AVAILABILITY_CONFIRM_HOURS,
      this.config.env.AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES,
    );
    const now = new Date();
    const initialStatus =
      now.getTime() >= confirmOpensAt.getTime() ? 'awaiting_confirm' : 'scheduled';

    return tx.shift.create({
      data: {
        applicationId: params.applicationId,
        jobId: params.jobId,
        workerUserId: params.workerUserId,
        employerId: params.employerId,
        branchId: params.branchId,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        confirmOpensAt,
        confirmDeadlineAt,
        status: initialStatus,
      },
    });
  }

  private mapShift(
    row: {
      id: string;
      applicationId: string;
      jobId: string;
      workerUserId: string;
      employerId: string;
      branchId: string | null;
      status: string;
      startsAt: Date;
      endsAt: Date;
      confirmOpensAt: Date;
      confirmDeadlineAt: Date;
      availabilityDecision: string | null;
      availabilityRespondedAt: Date | null;
      checkedInAt: Date | null;
      completedAt: Date | null;
    },
    job?: {
      title: string | null;
      sectorCode: string;
      payAmountMinor?: number | null;
      payCurrency?: string | null;
      amenities?: unknown;
      requiredDocumentTypes?: unknown;
      employer?: {
        legalName: string;
        tradingName: string | null;
        latitude: unknown;
        longitude: unknown;
      };
    } | null,
    branch?: { name: string; latitude: unknown; longitude: unknown } | null,
    extra?: { workerDisplayName?: string | null },
  ) {
    const now = new Date();
    return {
      id: row.id,
      applicationId: row.applicationId,
      jobId: row.jobId,
      workerUserId: row.workerUserId,
      employerId: row.employerId,
      branchId: row.branchId,
      status: row.status as ShiftStatus,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      jobTitle: job?.title ?? job?.sectorCode ?? null,
      branchName:
        branch?.name ??
        job?.employer?.tradingName ??
        job?.employer?.legalName ??
        null,
      branchLatitude: branch
        ? Number(branch.latitude)
        : job?.employer?.latitude != null
          ? Number(job.employer.latitude)
          : undefined,
      branchLongitude: branch
        ? Number(branch.longitude)
        : job?.employer?.longitude != null
          ? Number(job.employer.longitude)
          : undefined,
      payAmountMinor: job?.payAmountMinor ?? null,
      payCurrency: job?.payCurrency ?? 'TRY',
      amenities: jsonStrings(job?.amenities),
      requiredDocumentTypes: jsonStrings(job?.requiredDocumentTypes),
      confirmWindow: {
        opensAt: row.confirmOpensAt.toISOString(),
        deadlineAt: row.confirmDeadlineAt.toISOString(),
        isOpen: isConfirmWindowOpen(
          row.confirmOpensAt,
          row.confirmDeadlineAt,
          row.startsAt,
          now,
        ),
      },
      availabilityDecision: row.availabilityDecision as
        | AvailabilityDecision
        | null
        | undefined,
      availabilityRespondedAt:
        row.availabilityRespondedAt?.toISOString() ?? null,
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      workerDisplayName: extra?.workerDisplayName ?? null,
    };
  }

  async listMine(workerUserId: string, from?: string, to?: string) {
    const startsAt = startsAtWhere(from, to);
    const rows = await this.prisma.shift.findMany({
      where: { workerUserId, ...(startsAt ? { startsAt } : {}) },
      orderBy: { startsAt: 'asc' },
      include: { job: { include: { employer: true } }, branch: true },
    });
    return {
      items: rows.map((r) => this.mapShift(r, r.job, r.branch)),
    };
  }

  async listEmployerCalendar(ctx: AuthContext, from?: string, to?: string) {
    if (!ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const startsAt = startsAtWhere(from, to);
    const rows = await this.prisma.shift.findMany({
      where: {
        employerId: ctx.employerId,
        ...(startsAt ? { startsAt } : {}),
        ...(ctx.role === 'manager' && ctx.branchIds?.length
          ? { branchId: { in: ctx.branchIds } }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
      include: {
        job: true,
        branch: true,
        workerUser: { include: { workerProfile: true } },
      },
    });
    return {
      items: rows.map((row) =>
        this.mapShift(row, row.job, row.branch, {
          workerDisplayName: profileDisplayName(row.workerUser.workerProfile),
        }),
      ),
    };
  }

  async listEmployerOpenDisputes(ctx: AuthContext) {
    if (!ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const rows = await this.prisma.checkInDispute.findMany({
      where: {
        status: 'open',
        shift: { employerId: ctx.employerId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        shift: {
          include: {
            job: true,
            workerUser: { include: { workerProfile: true } },
          },
        },
      },
      take: 100,
    });
    return {
      items: rows.map((row) => ({
        disputeId: row.id,
        shiftId: row.shiftId,
        status: row.status as 'open' | 'manual_confirmed' | 'rejected',
        note: row.note,
        createdAt: row.createdAt.toISOString(),
        jobTitle: row.shift.job.title ?? row.shift.job.sectorCode,
        workerDisplayName: row.shift.workerUser.workerProfile
          ? `${row.shift.workerUser.workerProfile.firstName} ${row.shift.workerUser.workerProfile.lastName}`
          : null,
      })),
    };
  }

  async getForUser(
    userId: string,
    ctx: AuthContext | undefined,
    shiftId: string,
  ) {
    const row = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    if (ctx?.role === 'worker') {
      if (row.workerUserId !== userId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu vardiyaya erişiminiz yok.',
        );
      }
    } else if (ctx?.role === 'employer' || ctx?.role === 'manager') {
      await this.assertEmployerAccess(ctx, row);
    } else {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu vardiyaya erişiminiz yok.',
      );
    }
    return this.mapShift(row, row.job, row.branch);
  }

  async availabilityConfirm(
    workerUserId: string,
    shiftId: string,
    body: AvailabilityConfirmBody,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    if (!shift || shift.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    if (
      !isConfirmWindowOpen(
        shift.confirmOpensAt,
        shift.confirmDeadlineAt,
        shift.startsAt,
      )
    ) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Teyit penceresi kapalı.',
      );
    }

    if (
      shift.availabilityDecision === 'can_come' &&
      body.decision === 'cannot_come'
    ) {
      // agent-default gap-3h: allow change inside window
    } else if (shift.availabilityDecision) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Teyit zaten verildi.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.availabilityConfirm.create({
        data: {
          shiftId,
          decision: body.decision,
          reason: body.reason,
          actorUserId: workerUserId,
        },
      });

      if (body.decision === 'can_come') {
        await tx.shift.update({
          where: { id: shiftId },
          data: {
            status: 'can_come',
            availabilityDecision: 'can_come',
            availabilityRespondedAt: new Date(),
          },
        });
        return;
      }

      await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'cannot_come',
          availabilityDecision: 'cannot_come',
          availabilityRespondedAt: new Date(),
        },
      });
      await tx.application.update({
        where: { id: shift.applicationId },
        data: { status: 'withdrawn' },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId: shift.applicationId,
          eventType: 'withdrawn',
          actorUserId: workerUserId,
          metadata: { reason: body.reason ?? 'cannot_come' },
        },
      });
      await this.releaseSeat(tx, shift.jobId);

      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      const title = shift.job.title ?? shift.job.sectorCode;
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.cannot_come',
          dedupeKey: `shift.cannot_come:${shiftId}:${userId}`,
          templateInput: {
            jobTitle: title,
            workerDisplayName: 'İşçi',
          },
          data: { shiftId, jobId: shift.jobId },
        });
      }
    });

    if (body.decision === 'cannot_come') {
      const shiftRow = await this.prisma.shift.findUnique({
        where: { id: shiftId },
      });
      if (shiftRow) {
        await this.tokens.releasePartialHold(
          shiftRow.jobId,
          1,
          'cannot_come',
          `release:cannot_come:${shiftId}`,
        );
      }
    }

    const updated = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    return this.mapShift(updated!, updated!.job, updated!.branch);
  }

  async checkIn(
    workerUserId: string,
    shiftId: string,
    body: CheckInBody,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const prior = await this.prisma.checkIn.findUnique({
        where: { idempotencyKey },
        include: {
          shift: {
            include: { job: { include: { employer: true } }, branch: true },
          },
        },
      });
      if (prior) {
        if (prior.success) {
          return {
            shiftId: prior.shiftId,
            status: prior.shift.status as ShiftStatus,
            checkedInAt: prior.shift.checkedInAt!.toISOString(),
            distanceM: Number(prior.distanceM),
          };
        }
        if (prior.failureCode === ErrorCode.OUTSIDE_GEOFENCE) {
          throw new ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.OUTSIDE_GEOFENCE,
            'Şube alanı dışındasınız.',
          );
        }
        if (prior.failureCode === ErrorCode.MOCK_LOCATION_DETECTED) {
          throw new ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.MOCK_LOCATION_DETECTED,
            'Sahte konum algılandı.',
          );
        }
        if (prior.failureCode === ErrorCode.CHECKIN_WINDOW_CLOSED) {
          throw new ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.CHECKIN_WINDOW_CLOSED,
            'Check-in penceresi kapalı.',
          );
        }
      }
    }

    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    if (!shift || shift.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    if (shift.status !== 'can_come' && shift.status !== 'manual_confirmed') {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.AVAILABILITY_REQUIRED,
        'Önce gelebilirlik teyidi gerekli.',
      );
    }
    if (shift.checkedInAt) {
      return {
        shiftId: shift.id,
        status: shift.status as ShiftStatus,
        checkedInAt: shift.checkedInAt.toISOString(),
        distanceM: 0,
      };
    }

    assertValidCoordinates(body.latitude, body.longitude);

    const remote = await this.platform.getPublicRemoteConfig();
    const windowOpen = isCheckInWindowOpen(
      shift.startsAt,
      remote.checkinEarlyMinutes,
      remote.checkinLateMinutes,
    );
    if (!windowOpen) {
      await this.recordFailedCheckIn(shiftId, body, idempotencyKey, {
        failureCode: ErrorCode.CHECKIN_WINDOW_CLOSED,
        distanceM: 0,
      });
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.CHECKIN_WINDOW_CLOSED,
        'Check-in penceresi kapalı.',
      );
    }

    let geo: ReturnType<GeofenceService['evaluate']> | undefined;
    try {
      const site = requireJobSite({
        branch: shift.branch,
        employer: shift.job.employer,
      });
      geo = this.geofence.evaluate(
        {
          branchLatitude: site.latitude,
          branchLongitude: site.longitude,
          latitude: body.latitude,
          longitude: body.longitude,
          accuracyM: body.accuracyM,
          mockLocation: body.mockLocation,
          locationPermissionGranted: body.locationPermissionGranted,
          locationSource: body.locationSource,
        },
        {
          radiusM: remote.geofenceRadiusM,
          softRadiusM: remote.geofenceSoftRadiusM,
          maxAccuracyM: remote.geofenceMaxAccuracyM,
        },
      );
      this.geofence.assertInsideOrSoft(geo);
    } catch (error) {
      if (error instanceof ApiException && error.code === ErrorCode.MOCK_LOCATION_DETECTED) {
        await this.prisma.riskEvent.create({
          data: {
            userId: workerUserId,
            shiftId,
            type: 'mock_gps',
            score: 5,
            metadata: { platform: 'android' },
          },
        });
      }
      const failureCode =
        error instanceof ApiException ? error.code : ErrorCode.OUTSIDE_GEOFENCE;
      await this.recordFailedCheckIn(shiftId, body, idempotencyKey, {
        failureCode,
        distanceM: geo?.distanceM ?? 0,
      });
      throw error;
    }

    const checkedInAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.checkIn.create({
        data: {
          shiftId,
          latitude: body.latitude,
          longitude: body.longitude,
          accuracyM: body.accuracyM,
          distanceM: geo.distanceM,
          mockLocation: body.mockLocation ?? false,
          locationSource: body.locationSource ?? 'gps',
          softPass: geo.softPass,
          success: true,
          idempotencyKey,
        },
      });
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: 'checked_in', checkedInAt },
      });
      await this.ratings.markAttendanceConfirmed(tx, shiftId, checkedInAt);
      await this.tokens.captureForShift(tx, shiftId, idempotencyKey);

      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      const title = shift.job.title ?? shift.job.sectorCode;
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.worker_checked_in',
          dedupeKey: `shift.worker_checked_in:${shiftId}:${userId}`,
          templateInput: { jobTitle: title },
          data: { shiftId, jobId: shift.jobId },
        });
      }
    });

    return {
      shiftId,
      status: 'checked_in' as ShiftStatus,
      checkedInAt: checkedInAt.toISOString(),
      distanceM: geo.distanceM,
    };
  }

  async checkOut(workerUserId: string, shiftId: string, _body: CheckOutBody) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    if (!shift || shift.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    if (shift.status !== 'checked_in' && shift.status !== 'manual_confirmed') {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.APPLICATION_INVALID_STATE,
        'Check-out için aktif vardiya gerekli.',
      );
    }

    const completedAt = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'completed',
          completedAt,
          ratingOpensAt: completedAt,
        },
        include: { job: { include: { employer: true } }, branch: true },
      });

      // Early departure incident detection (>30 minutes before scheduled end)
      const leftEarlyMinutes = Math.round(
        (shift.endsAt.getTime() - completedAt.getTime()) / 60000,
      );
      if (leftEarlyMinutes > 30) {
        await tx.shiftIncident.create({
          data: {
            shiftId,
            workerUserId,
            type: 'early_departure',
            severity: 'medium',
            note: `Çalışan vardiya bitiş saatinden ${leftEarlyMinutes} dakika önce check-out yaptı.`,
          },
        });
      }

      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      const title = shift.job.title ?? shift.job.sectorCode;
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.worker_checked_out',
          dedupeKey: `shift.worker_checked_out:${shiftId}:${userId}`,
          templateInput: {
            jobTitle: title,
            workerDisplayName: 'İşçi',
          },
          data: { shiftId, jobId: shift.jobId },
        });
      }

      return res;
    });

    return this.mapShift(updated, updated.job, updated.branch);
  }

  async createDispute(
    workerUserId: string,
    shiftId: string,
    body: DisputeCreateBody,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: true },
    });
    if (!shift || shift.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.checkInDispute.create({
        data: {
          shiftId,
          workerUserId,
          note: body.note,
          status: 'open',
        },
      });
      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.dispute_update',
          dedupeKey: `shift.dispute_update:${created.id}:${userId}`,
          templateInput: { jobTitle: shift.job.title ?? shift.job.sectorCode },
          data: { shiftId, disputeId: created.id },
        });
      }
      return created;
    });
    return {
      id: dispute.id,
      shiftId: dispute.shiftId,
      status: 'open' as const,
      note: dispute.note,
      createdAt: dispute.createdAt.toISOString(),
    };
  }

  async createIncident(
    workerUserId: string,
    shiftId: string,
    body: ShiftIncidentCreateBody,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: true },
    });
    if (!shift || shift.workerUserId !== workerUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.shiftIncident.create({
        data: {
          shiftId,
          workerUserId,
          type: body.type,
          severity: body.severity,
          note: body.note ?? null,
        },
      });

      // Escalate high and critical safety incidents to platform risk auditing
      if (body.severity === 'high' || body.severity === 'critical') {
        await tx.riskEvent.create({
          data: {
            userId: workerUserId,
            shiftId,
            type: `incident.${body.type}.${body.severity}`,
            score: body.severity === 'critical' ? 10 : 5,
            metadata: {
              incidentId: row.id,
              severity: body.severity,
              employerId: shift.employerId,
              branchId: shift.branchId,
              note: body.note ?? null,
            },
          },
        });
      }

      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.dispute_update',
          dedupeKey: `shift.incident:${row.id}:${userId}`,
          templateInput: { jobTitle: shift.job.title ?? shift.job.sectorCode },
          data: { shiftId, incidentId: row.id, type: body.type, severity: body.severity },
        });
      }

      // Worker filing acknowledgment receipt
      await this.notifications.enqueueInTransaction(tx, {
        userId: workerUserId,
        type: 'shift.dispute_update',
        dedupeKey: `shift.incident.worker_ack:${row.id}:${workerUserId}`,
        templateInput: { jobTitle: shift.job.title ?? shift.job.sectorCode },
        data: { shiftId, incidentId: row.id, status: 'filed' },
      });

      return row;
    });
    return {
      id: created.id,
      shiftId: created.shiftId,
      type: created.type,
      severity: created.severity,
      note: created.note,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async rejectDispute(
    actorUserId: string,
    ctx: AuthContext,
    shiftId: string,
    disputeId: string,
    _body?: { reason?: string },
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    await this.assertEmployerAccess(ctx, shift);

    const dispute = await this.prisma.checkInDispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute || dispute.shiftId !== shiftId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İtiraz bulunamadı.',
      );
    }
    if (dispute.status !== 'open') {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'İtiraz zaten sonuçlandırılmış.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.checkInDispute.update({
        where: { id: disputeId },
        data: {
          status: 'rejected',
          resolvedByUserId: actorUserId,
          resolvedAt: new Date(),
        },
      });

      await this.notifications.enqueueInTransaction(tx, {
        userId: shift.workerUserId,
        type: 'shift.dispute_update',
        dedupeKey: `shift.dispute_rejected:${disputeId}`,
        templateInput: {
          jobTitle: shift.job.title ?? shift.job.sectorCode,
        },
        data: { shiftId, disputeId, status: 'rejected' },
      });

      return res;
    });

    return {
      id: updated.id,
      shiftId: updated.shiftId,
      status: 'rejected' as const,
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async manualConfirm(
    actorUserId: string,
    ctx: AuthContext,
    shiftId: string,
    idempotencyKey?: string,
  ) {
    const shift = await this.loadShiftForConfirm(shiftId);
    await this.assertEmployerAccess(ctx, shift);
    return this.applyManualConfirm(actorUserId, shift, idempotencyKey);
  }

  async adminManualConfirm(
    actorUserId: string,
    shiftId: string,
    idempotencyKey?: string,
  ) {
    const shift = await this.loadShiftForConfirm(shiftId);
    return this.applyManualConfirm(actorUserId, shift, idempotencyKey);
  }

  private async loadShiftForConfirm(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: { include: { employer: true } }, branch: true },
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

  private async applyManualConfirm(
    actorUserId: string,
    shift: {
      id: string;
      jobId: string;
      workerUserId: string;
      checkedInAt: Date | null;
      job: {
        title: string | null;
        sectorCode: string;
        employer?: { tradingName: string | null; legalName: string };
      };
      branch: { name: string } | null;
    },
    idempotencyKey?: string,
  ) {
    if (shift.checkedInAt) {
      const current = await this.prisma.shift.findUnique({
        where: { id: shift.id },
        include: { job: { include: { employer: true } }, branch: true },
      });
      return this.mapShift(current!, current!.job, current!.branch);
    }

    const checkedInAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.shift.update({
        where: { id: shift.id },
        data: { status: 'manual_confirmed', checkedInAt },
      });
      await this.ratings.markAttendanceConfirmed(tx, shift.id, checkedInAt);
      await tx.checkInDispute.updateMany({
        where: { shiftId: shift.id, status: 'open' },
        data: {
          status: 'manual_confirmed',
          resolvedByUserId: actorUserId,
          resolvedAt: checkedInAt,
        },
      });
      await this.tokens.captureForShift(tx, shift.id, idempotencyKey);
      await this.notifications.enqueueInTransaction(tx, {
        userId: shift.workerUserId,
        type: 'shift.manual_confirmed',
        dedupeKey: `shift.manual_confirmed:${shift.id}`,
        templateInput: {
          jobTitle: shift.job.title ?? shift.job.sectorCode,
          branchName:
            shift.branch?.name ??
            shift.job.employer?.tradingName ??
            shift.job.employer?.legalName,
        },
        data: { shiftId: shift.id, jobId: shift.jobId },
      });
    });

    const updated = await this.prisma.shift.findUnique({
      where: { id: shift.id },
      include: { job: { include: { employer: true } }, branch: true },
    });
    return this.mapShift(updated!, updated!.job, updated!.branch);
  }

  async promoteNextSubstitute(tx: Tx, jobId: string): Promise<string | null> {
    const candidates = await tx.application.findMany({
      where: { jobId, status: 'substitute' },
      include: {
        workerProfile: {
          include: {
            sectors: true,
            occupations: true,
          },
        },
        job: {
          include: {
            branch: true,
            employer: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      return null;
    }

    const firstJob = candidates[0].job;
    const jobSite = jobSiteFrom(firstJob);
    const jobContext = {
      sectorCode: firstJob.sectorCode,
      occupationCode: firstJob.occupationCode,
      latitude: jobSite ? Number(jobSite.latitude) : null,
      longitude: jobSite ? Number(jobSite.longitude) : null,
    };

    const candidateUserIds = candidates.map((c) => c.workerUserId);
    const pastShifts =
      (await tx.shift.findMany?.({
        where: { workerUserId: { in: candidateUserIds } },
        select: {
          workerUserId: true,
          status: true,
          job: { select: { sectorCode: true } },
        },
      })) ?? [];

    const shiftTally = new Map<
      string,
      { completed: number; cancelled: number; inSector: number }
    >();
    for (const s of pastShifts) {
      const entry = shiftTally.get(s.workerUserId) ?? {
        completed: 0,
        cancelled: 0,
        inSector: 0,
      };
      if (
        s.status === 'completed' ||
        s.status === 'checked_out' ||
        s.status === 'attendance_confirmed'
      ) {
        entry.completed += 1;
        if (s.job.sectorCode === firstJob.sectorCode) {
          entry.inSector += 1;
        }
      } else if (
        s.status === 'cancelled_by_worker' ||
        s.status === 'cancelled_late' ||
        s.status === 'cannot_come' ||
        s.status === 'no_show'
      ) {
        entry.cancelled += 1;
      }
      shiftTally.set(s.workerUserId, entry);
    }

    const pastRatings =
      (await tx.rating?.findMany?.({
        where: {
          targetWorkerUserId: { in: candidateUserIds },
          moderationStatus: 'approved',
        },
        select: { targetWorkerUserId: true, score: true },
      })) ?? [];
    const ratingsByUser = new Map<string, number[]>();
    for (const r of pastRatings) {
      if (!r.targetWorkerUserId) continue;
      const arr = ratingsByUser.get(r.targetWorkerUserId) ?? [];
      arr.push(r.score);
      ratingsByUser.set(r.targetWorkerUserId, arr);
    }

    const scored = candidates.map((app) => {
      const history = shiftTally.get(app.workerUserId) ?? {
        completed: 0,
        cancelled: 0,
        inSector: 0,
      };
      const ratings = ratingsByUser.get(app.workerUserId) ?? [];
      const score = computeCandidateScore(jobContext, {
        workerUserId: app.workerUserId,
        sectorCodes: app.workerProfile?.sectors.map((s) => s.sectorCode) ?? [],
        occupationCodes:
          app.workerProfile?.occupations.map((o) => o.occupationCode) ?? [],
        homeLatitude: app.workerProfile?.homeLatitude
          ? Number(app.workerProfile.homeLatitude)
          : null,
        homeLongitude: app.workerProfile?.homeLongitude
          ? Number(app.workerProfile.homeLongitude)
          : null,
        ratings,
        completedShiftsCount: history.completed,
        cancelledShiftsCount: history.cancelled,
        completedSectorShiftsCount: history.inSector,
      });
      return { app, score };
    });

    scored.sort((a, b) => b.score.totalScore - a.score.totalScore);
    const chosen = scored[0].app;

    await tx.application.update({
      where: { id: chosen.id },
      data: { status: 'accepted' },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId: chosen.id,
        eventType: 'accepted',
        actorUserId: chosen.workerUserId,
        metadata: { autoPromotedFromSubstitute: true },
      },
    });

    const shift = await this.createForAcceptedApplication(tx, {
      applicationId: chosen.id,
      jobId: chosen.jobId,
      workerUserId: chosen.workerUserId,
      employerId: chosen.job.employerId,
      branchId: chosen.job.branchId,
      startsAt: chosen.job.startsAt,
      endsAt: chosen.job.endsAt,
    });

    const jobTitle = chosen.job.title ?? chosen.job.sectorCode;
    await this.notifications.enqueueInTransaction(tx, {
      userId: chosen.workerUserId,
      type: 'shift.substitute_promoted',
      dedupeKey: `shift.substitute_promoted:${shift.id}:${chosen.workerUserId}`,
      templateInput: { jobTitle },
      data: { shiftId: shift.id, jobId: chosen.jobId },
    });

    const audience = await resolveEmployerAudience(
      tx,
      chosen.job.employerId,
      chosen.job.branchId,
    );
    const workerName = profileDisplayName(chosen.workerProfile);
    for (const userId of audience) {
      await this.notifications.enqueueInTransaction(tx, {
        userId,
        type: 'application.accepted',
        dedupeKey: `substitute.assigned:${shift.id}:${userId}`,
        templateInput: {
          jobTitle,
          workerDisplayName: workerName ?? 'Yedek Aday',
          branchName: jobSite?.name,
        },
        data: { shiftId: shift.id, jobId: chosen.jobId },
      });
    }

    return shift.id;
  }

  async releaseSeat(tx: Tx, jobId: string) {
    const promotedShiftId = await this.promoteNextSubstitute(tx, jobId);
    if (promotedShiftId) {
      return;
    }
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return;
    }
    const remaining = Math.min(job.headcount, job.remainingHeadcount + 1);
    const status =
      job.status === 'closed' && remaining > 0 ? 'published' : job.status;
    await tx.job.update({
      where: { id: jobId },
      data: { remainingHeadcount: remaining, status },
    });
  }

  async processNoResponseRelease(shiftId: string) {
    await this.prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({ where: { id: shiftId } });
      if (!shift || shift.availabilityDecision) {
        return;
      }
      if (shift.status === 'released' || shift.status === 'cannot_come') {
        return;
      }
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: 'released' },
      });
      await this.releaseSeat(tx, shift.jobId);
      const job = await tx.job.findUnique({ where: { id: shift.jobId } });
      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.confirm_timeout',
          dedupeKey: `shift.confirm_timeout:${shiftId}:${userId}`,
          templateInput: {
            jobTitle: job?.title ?? job?.sectorCode ?? 'Vardiya',
          },
          data: { shiftId, jobId: shift.jobId },
        });
      }
      await this.notifications.enqueueInTransaction(tx, {
        userId: shift.workerUserId,
        type: 'shift.confirm_timeout',
        dedupeKey: `shift.confirm_timeout:${shiftId}:worker`,
        templateInput: {
          jobTitle: job?.title ?? job?.sectorCode ?? 'Vardiya',
        },
        data: { shiftId, jobId: shift.jobId },
      });
    });
    await this.tokens.releasePartialHold(
      (
        await this.prisma.shift.findUnique({ where: { id: shiftId } })
      )!.jobId,
      1,
      'confirm_timeout',
      `release:confirm_timeout:${shiftId}`,
    );
  }

  private async recordFailedCheckIn(
    shiftId: string,
    body: CheckInBody,
    idempotencyKey: string | undefined,
    params: { failureCode: string; distanceM: number },
  ) {
    if (!idempotencyKey) {
      return;
    }
    await this.prisma.checkIn.create({
      data: {
        shiftId,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracyM: body.accuracyM,
        distanceM: params.distanceM,
        mockLocation: body.mockLocation ?? false,
        locationSource: body.locationSource ?? 'gps',
        success: false,
        failureCode: params.failureCode,
        idempotencyKey,
      },
    });
  }

  private async assertEmployerAccess(
    ctx: AuthContext,
    shift: { employerId: string; branchId: string | null },
  ) {
    if (!ctx.employerId || ctx.employerId !== shift.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu vardiyaya erişiminiz yok.',
      );
    }
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      if (!shift.branchId || !ctx.branchIds.includes(shift.branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
    }
  }

  async processCheckInNoShows(): Promise<number> {
    const now = new Date();
    const remote = await this.platform.getPublicRemoteConfig();
    const lateThresholdMs = remote.checkinLateMinutes * 60 * 1000;

    const staleCanCome = await this.prisma.shift.findMany({
      where: {
        status: 'can_come',
        checkedInAt: null,
      },
      include: { job: true },
      take: 50,
    });

    const noShowShifts = staleCanCome.filter(
      (s) => now.getTime() > s.startsAt.getTime() + lateThresholdMs,
    );

    let processedCount = 0;
    for (const shift of noShowShifts) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.shift.findUnique({ where: { id: shift.id } });
        if (!current || current.status !== 'can_come' || current.checkedInAt) {
          return;
        }

        await tx.shift.update({
          where: { id: shift.id },
          data: { status: 'cannot_come' },
        });

        await tx.riskEvent.create({
          data: {
            userId: shift.workerUserId,
            shiftId: shift.id,
            type: 'no_show',
            score: 5,
            metadata: {
              startsAt: shift.startsAt.toISOString(),
              detectedAt: now.toISOString(),
            },
          },
        });

        await tx.shiftIncident.create({
          data: {
            shiftId: shift.id,
            workerUserId: shift.workerUserId,
            type: 'no_show',
            severity: 'high',
            note: 'Vardiya saatinde check-in yapılmadı (No-show tespit edildi).',
          },
        });

        await this.releaseSeat(tx, shift.jobId);

        const audience = await resolveEmployerAudience(
          tx,
          shift.employerId,
          shift.branchId,
        );
        const title = shift.job.title ?? shift.job.sectorCode;
        for (const userId of audience) {
          await this.notifications.enqueueInTransaction(tx, {
            userId,
            type: 'shift.no_show',
            dedupeKey: `shift.no_show:${shift.id}:${userId}`,
            templateInput: { jobTitle: title, workerDisplayName: 'İşçi' },
            data: { shiftId: shift.id, jobId: shift.jobId },
          });
        }
        processedCount += 1;
      });
    }

    return processedCount;
  }

  async reconcileStaleCheckedInShifts(): Promise<number> {
    const now = new Date();
    const graceMs = 2 * 60 * 60 * 1000;

    const staleCheckedIn = await this.prisma.shift.findMany({
      where: {
        status: { in: ['checked_in', 'manual_confirmed'] },
        endsAt: { lt: new Date(now.getTime() - graceMs) },
      },
      include: { job: true },
      take: 50,
    });

    let reconciledCount = 0;
    for (const shift of staleCheckedIn) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.shift.findUnique({ where: { id: shift.id } });
        if (
          !current ||
          (current.status !== 'checked_in' && current.status !== 'manual_confirmed')
        ) {
          return;
        }

        const completedAt = current.endsAt;
        await tx.shift.update({
          where: { id: shift.id },
          data: {
            status: 'completed',
            completedAt,
            ratingOpensAt: now,
          },
        });

        await tx.shiftIncident.create({
          data: {
            shiftId: shift.id,
            workerUserId: shift.workerUserId,
            type: 'system_auto_checkout',
            severity: 'low',
            note: 'Vardiya bitiş süresini aştığı için sistem tarafından otomatik check-out yapıldı.',
          },
        });

        const audience = await resolveEmployerAudience(
          tx,
          shift.employerId,
          shift.branchId,
        );
        const title = shift.job.title ?? shift.job.sectorCode;
        for (const userId of audience) {
          await this.notifications.enqueueInTransaction(tx, {
            userId,
            type: 'shift.worker_checked_out',
            dedupeKey: `shift.auto_checked_out:${shift.id}:${userId}`,
            templateInput: {
              jobTitle: title,
              workerDisplayName: 'İşçi (Otomatik Tamamlama)',
            },
            data: { shiftId: shift.id, jobId: shift.jobId },
          });
        }
        reconciledCount += 1;
      });
    }

    return reconciledCount;
  }
}
