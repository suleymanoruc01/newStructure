import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  AvailabilityConfirmBody,
  AvailabilityDecision,
  CheckInBody,
  CheckOutBody,
  DisputeCreateBody,
  ShiftStatus,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';
import type { Prisma } from '../generated/prisma/client.js';

import { ApiException } from '../common/api.exception.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import { GeofenceService } from '../location/geofence.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { resolveEmployerAudience } from './shift-notify.util.js';
import {
  computeConfirmWindow,
  isCheckInWindowOpen,
  isConfirmWindowOpen,
} from './shift-timing.util.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
    private readonly geofence: GeofenceService,
    private readonly tokens: TokensService,
    private readonly ratings: RatingsService,
  ) {}

  async createForAcceptedApplication(
    tx: Tx,
    params: {
      applicationId: string;
      jobId: string;
      workerUserId: string;
      employerId: string;
      branchId: string;
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
      branchId: string;
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
    job?: { title: string | null; sectorCode: string } | null,
    branch?: { name: string; latitude: unknown; longitude: unknown } | null,
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
      branchName: branch?.name ?? null,
      branchLatitude: branch ? Number(branch.latitude) : undefined,
      branchLongitude: branch ? Number(branch.longitude) : undefined,
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
    };
  }

  async listMine(workerUserId: string) {
    const rows = await this.prisma.shift.findMany({
      where: { workerUserId },
      orderBy: { startsAt: 'asc' },
      include: { job: true, branch: true },
    });
    return {
      items: rows.map((r) => this.mapShift(r, r.job, r.branch)),
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
      include: { job: true, branch: true },
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
      include: { job: true, branch: true },
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
      include: { job: true, branch: true },
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
        include: { shift: { include: { job: true, branch: true } } },
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
      include: { job: true, branch: true },
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

    const windowOpen = isCheckInWindowOpen(
      shift.startsAt,
      this.config.env.CHECKIN_EARLY_MINUTES,
      this.config.env.CHECKIN_LATE_MINUTES,
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
      geo = this.geofence.evaluate({
        branchLatitude: Number(shift.branch.latitude),
        branchLongitude: Number(shift.branch.longitude),
        latitude: body.latitude,
        longitude: body.longitude,
        accuracyM: body.accuracyM,
        mockLocation: body.mockLocation,
        locationPermissionGranted: body.locationPermissionGranted,
      });
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
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
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
    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'completed', completedAt: new Date() },
      include: { job: true, branch: true },
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
    const dispute = await this.prisma.checkInDispute.create({
      data: {
        shiftId,
        workerUserId,
        note: body.note,
        status: 'open',
      },
    });
    await this.prisma.$transaction(async (tx) => {
      const audience = await resolveEmployerAudience(
        tx,
        shift.employerId,
        shift.branchId,
      );
      for (const userId of audience) {
        await this.notifications.enqueueInTransaction(tx, {
          userId,
          type: 'shift.dispute_update',
          dedupeKey: `shift.dispute_update:${dispute.id}:${userId}`,
          templateInput: { jobTitle: shift.job.title ?? shift.job.sectorCode },
          data: { shiftId, disputeId: dispute.id },
        });
      }
    });
    return {
      id: dispute.id,
      shiftId: dispute.shiftId,
      status: 'open' as const,
      note: dispute.note,
      createdAt: dispute.createdAt.toISOString(),
    };
  }

  async manualConfirm(
    actorUserId: string,
    ctx: AuthContext,
    shiftId: string,
    idempotencyKey?: string,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: true, branch: true },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    await this.assertEmployerAccess(ctx, shift);
    if (shift.checkedInAt) {
      return this.mapShift(shift, shift.job, shift.branch);
    }

    const checkedInAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: 'manual_confirmed', checkedInAt },
      });
      await this.ratings.markAttendanceConfirmed(tx, shiftId, checkedInAt);
      await tx.checkInDispute.updateMany({
        where: { shiftId, status: 'open' },
        data: {
          status: 'manual_confirmed',
          resolvedByUserId: actorUserId,
          resolvedAt: checkedInAt,
        },
      });
      await this.tokens.captureForShift(tx, shiftId, idempotencyKey);
      await this.notifications.enqueueInTransaction(tx, {
        userId: shift.workerUserId,
        type: 'shift.manual_confirmed',
        dedupeKey: `shift.manual_confirmed:${shiftId}`,
        templateInput: {
          jobTitle: shift.job.title ?? shift.job.sectorCode,
          branchName: shift.branch.name,
        },
        data: { shiftId, jobId: shift.jobId },
      });
    });

    const updated = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { job: true, branch: true },
    });
    return this.mapShift(updated!, updated!.job, updated!.branch);
  }

  async releaseSeat(tx: Tx, jobId: string) {
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
        success: false,
        failureCode: params.failureCode,
        idempotencyKey,
      },
    });
  }

  private async assertEmployerAccess(
    ctx: AuthContext,
    shift: { employerId: string; branchId: string },
  ) {
    if (!ctx.employerId || ctx.employerId !== shift.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu vardiyaya erişiminiz yok.',
      );
    }
    if (ctx.role === 'manager' && ctx.branchIds?.length) {
      if (!ctx.branchIds.includes(shift.branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
    }
  }
}
