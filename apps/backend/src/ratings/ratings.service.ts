import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  RatingCreateBody,
  RatingPendingItem,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';
import type { Prisma } from '../generated/prisma/client.js';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { resolveEmployerAudience } from '../shifts/shift-notify.util.js';
import { containsProfanity } from './profanity-filter.js';

type Tx = Prisma.TransactionClient;

const RATING_ELIGIBLE_STATUSES = new Set([
  'checked_in',
  'manual_confirmed',
  'completed',
]);

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  ratingOpensAtFrom(confirmedAt: Date): Date {
    const hours = this.config.env.RATING_OPEN_DELAY_HOURS;
    return new Date(confirmedAt.getTime() + hours * 60 * 60 * 1000);
  }

  async markAttendanceConfirmed(
    tx: Tx,
    shiftId: string,
    confirmedAt: Date,
  ): Promise<void> {
    const opensAt = this.ratingOpensAtFrom(confirmedAt);
    await tx.shift.update({
      where: { id: shiftId },
      data: {
        attendanceConfirmedAt: confirmedAt,
        ratingOpensAt: opensAt,
      },
    });
  }

  async listPending(userId: string, ctx: AuthContext) {
    const now = new Date();
    const items: RatingPendingItem[] = [];

    if (ctx.role === 'worker') {
      const shifts = await this.prisma.shift.findMany({
        where: {
          workerUserId: userId,
          attendanceConfirmedAt: { not: null },
          ratingOpensAt: { lte: now },
          status: { in: [...RATING_ELIGIBLE_STATUSES] },
        },
        include: { job: true, branch: true, employer: true },
        orderBy: { ratingOpensAt: 'asc' },
        take: 50,
      });
      const rated = await this.prisma.rating.findMany({
        where: {
          authorUserId: userId,
          shiftId: { in: shifts.map((s) => s.id) },
        },
        select: { shiftId: true },
      });
      const ratedSet = new Set(rated.map((r) => r.shiftId));
      for (const shift of shifts) {
        if (ratedSet.has(shift.id)) {
          continue;
        }
        items.push({
          shiftId: shift.id,
          jobId: shift.jobId,
          jobTitle: shift.job.title,
          branchId: shift.branchId,
          branchName: shift.branch.name,
          counterpartLabel:
            shift.employer.tradingName ?? shift.employer.legalName,
          opensAt: shift.ratingOpensAt!.toISOString(),
        });
      }
    } else if (ctx.role === 'employer' || ctx.role === 'manager') {
      if (!ctx.employerId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'İşveren bağlamı gerekli.',
        );
      }
      const shifts = await this.prisma.shift.findMany({
        where: {
          employerId: ctx.employerId,
          attendanceConfirmedAt: { not: null },
          ratingOpensAt: { lte: now },
          status: { in: [...RATING_ELIGIBLE_STATUSES] },
        },
        include: { job: true, branch: true, workerUser: { include: { workerProfile: true } } },
        orderBy: { ratingOpensAt: 'asc' },
        take: 50,
      });
      const rated = await this.prisma.rating.findMany({
        where: {
          authorUserId: userId,
          shiftId: { in: shifts.map((s) => s.id) },
        },
        select: { shiftId: true },
      });
      const ratedSet = new Set(rated.map((r) => r.shiftId));
      for (const shift of shifts) {
        if (ratedSet.has(shift.id)) {
          continue;
        }
        const profile = shift.workerUser.workerProfile;
        const name = profile
          ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
          : '';
        items.push({
          shiftId: shift.id,
          jobId: shift.jobId,
          jobTitle: shift.job.title,
          branchId: shift.branchId,
          branchName: shift.branch.name,
          counterpartLabel: name || 'İş arayan',
          opensAt: shift.ratingOpensAt!.toISOString(),
        });
      }
    }

    return { items };
  }

  async createRating(
    userId: string,
    ctx: AuthContext,
    body: RatingCreateBody,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: body.shiftId },
      include: { job: true, branch: true },
    });
    if (!shift) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Vardiya bulunamadı.',
      );
    }
    if (!RATING_ELIGIBLE_STATUSES.has(shift.status)) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.RATING_NOT_ELIGIBLE,
        'Bu vardiya için değerlendirme yapılamaz.',
      );
    }
    if (!shift.attendanceConfirmedAt || !shift.ratingOpensAt) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.RATING_NOT_ELIGIBLE,
        'Katılım teyidi olmadan değerlendirme yapılamaz.',
      );
    }
    const now = new Date();
    if (now.getTime() < shift.ratingOpensAt.getTime()) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.RATING_WINDOW_CLOSED,
        'Değerlendirme penceresi henüz açılmadı.',
      );
    }

    let authorRole: 'worker' | 'employer';
    let targetWorkerUserId: string | null = null;
    let targetEmployerId: string | null = null;
    let branchId: string | null = null;

    if (ctx.role === 'worker') {
      if (shift.workerUserId !== userId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu vardiyayı değerlendiremezsiniz.',
        );
      }
      authorRole = 'worker';
      targetEmployerId = shift.employerId;
      branchId = shift.branchId;
    } else if (ctx.role === 'employer' || ctx.role === 'manager') {
      if (!ctx.employerId || ctx.employerId !== shift.employerId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu vardiyayı değerlendiremezsiniz.',
        );
      }
      authorRole = 'employer';
      targetWorkerUserId = shift.workerUserId;
    } else {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu işlem için yetkiniz yok.',
      );
    }

    const existing = await this.prisma.rating.findUnique({
      where: { shiftId_authorUserId: { shiftId: body.shiftId, authorUserId: userId } },
    });
    if (existing) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu vardiya için zaten değerlendirme yaptınız.',
      );
    }

    const comment = body.comment?.trim() || null;
    const moderationStatus =
      comment && containsProfanity(comment) ? 'queued' : 'visible';

    const row = await this.prisma.rating.create({
      data: {
        shiftId: body.shiftId,
        authorUserId: userId,
        authorRole,
        targetWorkerUserId,
        targetEmployerId,
        branchId,
        score: body.score,
        comment,
        moderationStatus,
      },
    });

    return {
      id: row.id,
      shiftId: row.shiftId,
      score: row.score,
      comment: row.comment,
      moderationStatus: row.moderationStatus as 'visible' | 'queued' | 'rejected',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async computeWorkerAverage(workerUserId: string) {
    const agg = await this.prisma.rating.aggregate({
      where: {
        targetWorkerUserId: workerUserId,
        moderationStatus: 'visible',
      },
      _avg: { score: true },
      _count: { _all: true },
    });
    return {
      average: agg._avg.score ?? null,
      count: agg._count._all,
    };
  }

  async computeEmployerAverage(employerId: string) {
    const agg = await this.prisma.rating.aggregate({
      where: {
        targetEmployerId: employerId,
        moderationStatus: 'visible',
      },
      _avg: { score: true },
      _count: { _all: true },
    });
    return {
      average: agg._avg.score ?? null,
      count: agg._count._all,
    };
  }

  async sendDueRatingNotifications(): Promise<void> {
    const now = new Date();
    const shifts = await this.prisma.shift.findMany({
      where: {
        attendanceConfirmedAt: { not: null },
        ratingOpensAt: { lte: now },
        status: { in: [...RATING_ELIGIBLE_STATUSES] },
        OR: [
          { ratingWorkerNotifiedAt: null },
          { ratingEmployerNotifiedAt: null },
        ],
      },
      include: { job: true },
      take: 50,
    });

    for (const shift of shifts) {
      await this.prisma.$transaction(async (tx) => {
        const title = shift.job.title ?? shift.job.sectorCode;
        if (!shift.ratingWorkerNotifiedAt) {
          await this.notifications.enqueueInTransaction(tx, {
            userId: shift.workerUserId,
            type: 'rating.pending',
            dedupeKey: `rating.pending:${shift.id}:${shift.workerUserId}`,
            templateInput: { jobTitle: title },
            data: { shiftId: shift.id, jobId: shift.jobId },
          });
          await tx.shift.update({
            where: { id: shift.id },
            data: { ratingWorkerNotifiedAt: now },
          });
        }
        if (!shift.ratingEmployerNotifiedAt) {
          const audience = await resolveEmployerAudience(
            tx,
            shift.employerId,
            shift.branchId,
          );
          for (const userId of audience) {
            await this.notifications.enqueueInTransaction(tx, {
              userId,
              type: 'rating.pending',
              dedupeKey: `rating.pending:${shift.id}:${userId}`,
              templateInput: { jobTitle: title },
              data: { shiftId: shift.id, jobId: shift.jobId },
            });
          }
          await tx.shift.update({
            where: { id: shift.id },
            data: { ratingEmployerNotifiedAt: now },
          });
        }
      });
    }
  }
}
