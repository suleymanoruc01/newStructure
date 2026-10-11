import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthContext, FavoriteCreateBody } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, ctx: AuthContext) {
    const rows = await this.prisma.favorite.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const type = row.targetKind === 'worker_user' ? 'worker' : 'employer';
        const mutual = await this.isMutual(row);
        return {
          id: row.id,
          type,
          targetId: row.targetId,
          mutual,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    );

    return { items };
  }

  private async isMutual(row: {
    targetKind: string;
    targetId: string;
    ownerUserId: string;
    ownerEmployerId: string | null;
  }): Promise<boolean> {
    if (row.targetKind === 'worker_user') {
      if (!row.ownerEmployerId) {
        return false;
      }
      const workerUserId = row.targetId;
      const reverse = await this.prisma.favorite.findFirst({
        where: {
          ownerUserId: workerUserId,
          targetKind: 'employer',
          targetId: row.ownerEmployerId,
        },
      });
      return Boolean(reverse);
    }
    const employerId = row.targetId;
    const workerUserId = row.ownerUserId;
    const reverse = await this.prisma.favorite.findFirst({
      where: {
        ownerEmployerId: employerId,
        targetKind: 'worker_user',
        targetId: workerUserId,
      },
    });
    return Boolean(reverse);
  }

  async create(
    userId: string,
    ctx: AuthContext,
    body: FavoriteCreateBody,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const prior = await this.prisma.favorite.findFirst({
        where: { ownerUserId: userId, targetKind: this.targetKind(body.type), targetId: body.id },
      });
      if (prior) {
        return this.mapFavorite(prior, await this.isMutual(prior));
      }
    }

    if (body.type === 'worker') {
      if (ctx.role !== 'employer' && ctx.role !== 'manager') {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'İşçiyi favoriye almak için işveren hesabı gerekli.',
        );
      }
      if (!ctx.employerId) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'İşveren bağlamı gerekli.',
        );
      }
      const worker = await this.prisma.user.findUnique({
        where: { id: body.id },
        include: { workerProfile: true },
      });
      if (!worker?.workerProfile) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND,
          'İş arayan bulunamadı.',
        );
      }
      const row = await this.prisma.favorite.upsert({
        where: {
          ownerUserId_targetKind_targetId: {
            ownerUserId: userId,
            targetKind: 'worker_user',
            targetId: body.id,
          },
        },
        create: {
          ownerUserId: userId,
          ownerEmployerId: ctx.employerId,
          targetKind: 'worker_user',
          targetId: body.id,
        },
        update: {},
      });
      return this.mapFavorite(row, await this.isMutual(row));
    }

    if (ctx.role !== 'worker') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşvereni favoriye almak için iş arayan hesabı gerekli.',
      );
    }
    const employer = await this.prisma.employer.findUnique({
      where: { id: body.id },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const row = await this.prisma.favorite.upsert({
      where: {
        ownerUserId_targetKind_targetId: {
          ownerUserId: userId,
          targetKind: 'employer',
          targetId: body.id,
        },
      },
      create: {
        ownerUserId: userId,
        targetKind: 'employer',
        targetId: body.id,
      },
      update: {},
    });
    return this.mapFavorite(row, await this.isMutual(row));
  }

  async remove(userId: string, favoriteId: string) {
    const row = await this.prisma.favorite.findFirst({
      where: { id: favoriteId, ownerUserId: userId },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Favori bulunamadı.',
      );
    }
    await this.prisma.favorite.delete({ where: { id: favoriteId } });
  }

  async employerFavoritedWorker(
    employerId: string,
    workerUserId: string,
  ): Promise<boolean> {
    const hit = await this.prisma.favorite.findFirst({
      where: {
        ownerEmployerId: employerId,
        targetKind: 'worker_user',
        targetId: workerUserId,
      },
    });
    return Boolean(hit);
  }

  async favoredEmployerIdsForWorker(
    workerUserId: string,
    employerIds: string[],
  ): Promise<Set<string>> {
    if (!employerIds.length) {
      return new Set();
    }
    const favoritedWorkers = await this.prisma.favorite.findMany({
      where: {
        ownerEmployerId: { in: employerIds },
        targetKind: 'worker_user',
        targetId: workerUserId,
      },
      select: { ownerEmployerId: true },
    });
    return new Set(
      favoritedWorkers
        .map((f) => f.ownerEmployerId)
        .filter((id): id is string => Boolean(id)),
    );
  }

  private targetKind(type: 'worker' | 'employer'): string {
    return type === 'worker' ? 'worker_user' : 'employer';
  }

  private mapFavorite(
    row: {
      id: string;
      targetKind: string;
      targetId: string;
      createdAt: Date;
    },
    mutual: boolean,
  ) {
    return {
      id: row.id,
      type: row.targetKind === 'worker_user' ? 'worker' : 'employer',
      targetId: row.targetId,
      mutual,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
