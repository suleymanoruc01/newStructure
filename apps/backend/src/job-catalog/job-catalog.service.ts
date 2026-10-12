import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import type {
  AdminJobCatalogCreateBody,
  AdminJobCatalogOccupationCreateBody,
  AdminJobCatalogOccupationPatchBody,
  AdminJobCatalogPatchBody,
  AdminJobCatalogSectorCreateBody,
  AdminJobCatalogSectorPatchBody,
  JobCatalogOccupationRequirements,
} from '@parton/api-contracts';
import {
  ErrorCode,
  jobCatalogOccupationRequirementsSchema,
} from '@parton/api-contracts';

import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SEED_CATALOG: {
  code: string;
  displayName: string;
  icon: string;
  occupations: { code: string; title: string }[];
}[] = [
  {
    code: 'hospitality',
    displayName: 'Konaklama & Yeme-İçme',
    icon: '🍽️',
    occupations: [
      { code: 'waiter', title: 'Garson' },
      { code: 'kitchen', title: 'Mutfak' },
    ],
  },
  {
    code: 'retail',
    displayName: 'Perakende',
    icon: '🛒',
    occupations: [
      { code: 'cashier', title: 'Kasiyer' },
      { code: 'stocker', title: 'Reyon' },
    ],
  },
  {
    code: 'logistics',
    displayName: 'Lojistik',
    icon: '📦',
    occupations: [{ code: 'picker', title: 'Depo' }],
  },
];

@Injectable()
export class JobCatalogService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LegalAuditLogger,
  ) {}

  private parseRequirements(raw: unknown): JobCatalogOccupationRequirements {
    const parsed = jobCatalogOccupationRequirementsSchema.safeParse(raw ?? {});
    if (parsed.success) {
      return parsed.data;
    }
    return { requiredDocumentTypes: [] };
  }

  private mapOccupation(row: {
    id: string;
    sectorId: string;
    code: string;
    title: string;
    description: string | null;
    requirements: unknown;
    sortOrder: number;
    active: boolean;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      sectorId: row.sectorId,
      code: row.code,
      title: row.title,
      description: row.description,
      requirements: this.parseRequirements(row.requirements),
      sortOrder: row.sortOrder,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async mapSectorTree(
    sector: {
      id: string;
      code: string;
      displayName: string;
      icon: string;
      sortOrder: number;
      active: boolean;
      createdAt: Date;
      occupations: {
        id: string;
        sectorId: string;
        code: string;
        title: string;
        description: string | null;
        requirements: unknown;
        sortOrder: number;
        active: boolean;
        createdAt: Date;
      }[];
    },
  ) {
    return {
      id: sector.id,
      code: sector.code,
      displayName: sector.displayName,
      icon: sector.icon,
      sortOrder: sector.sortOrder,
      active: sector.active,
      createdAt: sector.createdAt.toISOString(),
      occupations: sector.occupations
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'tr'),
        )
        .map((row) => this.mapOccupation(row)),
    };
  }

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.jobCatalogSector.count();
    if (count > 0) {
      await this.repairSeedSectorDisplayNames();
      return;
    }
    for (const [sectorIndex, sector] of SEED_CATALOG.entries()) {
      const created = await this.prisma.jobCatalogSector.create({
        data: {
          code: sector.code,
          displayName: sector.displayName,
          icon: sector.icon,
          sortOrder: sectorIndex,
          occupations: {
            create: sector.occupations.map((job, jobIndex) => ({
              code: job.code,
              title: job.title,
              sortOrder: jobIndex,
            })),
          },
        },
      });
      void created;
    }
  }

  private async repairSeedSectorDisplayNames(): Promise<void> {
    for (const seed of SEED_CATALOG) {
      await this.prisma.jobCatalogSector.updateMany({
        where: { code: seed.code, displayName: seed.code },
        data: { displayName: seed.displayName },
      });
    }
  }

  async assertActivePair(sectorCode: string, occupationCode?: string | null) {
    const sector = await this.prisma.jobCatalogSector.findUnique({
      where: { code: sectorCode.trim().toLowerCase() },
    });
    if (!sector || !sector.active) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.JOB_CATALOG_INVALID,
        'Geçerli bir sektör seçin.',
      );
    }
    if (!occupationCode) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.JOB_CATALOG_INVALID,
        'Geçerli bir meslek seçin.',
      );
    }
    const occupation = await this.prisma.jobCatalogOccupation.findUnique({
      where: {
        sectorId_code: {
          sectorId: sector.id,
          code: occupationCode.trim().toLowerCase(),
        },
      },
    });
    if (!occupation || !occupation.active) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.JOB_CATALOG_INVALID,
        'Geçerli bir meslek seçin.',
      );
    }
  }

  async listActive() {
    const sectors = await this.prisma.jobCatalogSector.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        occupations: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const items = sectors.flatMap((sector) =>
      sector.occupations.map((row) => ({
        id: row.id,
        sectorCode: sector.code,
        occupationCode: row.code,
        title: row.title,
      })),
    );
    return {
      items,
      sectors: sectors.map((sector) => ({
        code: sector.code,
        displayName: sector.displayName,
        icon: sector.icon,
        occupations: sector.occupations.map((row) => ({
          id: row.id,
          code: row.code,
          title: row.title,
        })),
      })),
    };
  }

  async listAllAdmin() {
    const sectors = await this.prisma.jobCatalogSector.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        occupations: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return {
      sectors: await Promise.all(sectors.map((row) => this.mapSectorTree(row))),
    };
  }

  async createSector(
    body: AdminJobCatalogSectorCreateBody,
    actorUserId: string,
    requestId: string,
  ) {
    const code = body.code.trim().toLowerCase();
    const existing = await this.prisma.jobCatalogSector.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu sektör kodu zaten var.',
      );
    }
    const row = await this.prisma.jobCatalogSector.create({
      data: {
        code,
        displayName: body.displayName.trim(),
        icon: body.icon?.trim() || '📂',
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
      include: { occupations: true },
    });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_sector_created',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_sector',
      resourceId: row.id,
      requestId,
      metadata: { code: row.code },
    });
    return this.mapSectorTree(row);
  }

  async patchSector(
    id: string,
    body: AdminJobCatalogSectorPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.jobCatalogSector.findUnique({
      where: { id },
      include: { occupations: true },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Sektör bulunamadı.',
      );
    }
    const active = body.active;
    const row = await this.prisma.$transaction(async (tx) => {
      const sector = await tx.jobCatalogSector.update({
        where: { id },
        data: {
          displayName: body.displayName?.trim(),
          icon: body.icon?.trim(),
          sortOrder: body.sortOrder,
          active: body.active,
        },
        include: { occupations: true },
      });
      if (active !== undefined) {
        await tx.jobCatalogOccupation.updateMany({
          where: { sectorId: id },
          data: { active },
        });
        const refreshed = await tx.jobCatalogSector.findUnique({
          where: { id },
          include: { occupations: true },
        });
        return refreshed ?? sector;
      }
      return sector;
    });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_sector_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_sector',
      resourceId: id,
      requestId,
      metadata: body,
    });
    return this.mapSectorTree(row);
  }

  async createOccupation(
    sectorId: string,
    body: AdminJobCatalogOccupationCreateBody,
    actorUserId: string,
    requestId: string,
  ) {
    const sector = await this.prisma.jobCatalogSector.findUnique({
      where: { id: sectorId },
    });
    if (!sector) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Sektör bulunamadı.',
      );
    }
    const code = body.code.trim().toLowerCase();
    const dup = await this.prisma.jobCatalogOccupation.findUnique({
      where: { sectorId_code: { sectorId, code } },
    });
    if (dup) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu meslek kodu sektörde zaten var.',
      );
    }
    const requirements = body.requirements
      ? jobCatalogOccupationRequirementsSchema.parse(body.requirements)
      : { requiredDocumentTypes: [] };
    const row = await this.prisma.jobCatalogOccupation.create({
      data: {
        sectorId,
        code,
        title: body.title.trim(),
        description: body.description ?? null,
        requirements,
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_occupation_created',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_occupation',
      resourceId: row.id,
      requestId,
      metadata: { sectorId, code },
    });
    return this.mapOccupation(row);
  }

  async patchOccupation(
    id: string,
    body: AdminJobCatalogOccupationPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.jobCatalogOccupation.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Pozisyon bulunamadı.',
      );
    }
    const code =
      body.code !== undefined ? body.code.trim().toLowerCase() : existing.code;
    if (code !== existing.code) {
      const dup = await this.prisma.jobCatalogOccupation.findUnique({
        where: { sectorId_code: { sectorId: existing.sectorId, code } },
      });
      if (dup) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.CONFLICT,
          'Bu meslek kodu sektörde zaten var.',
        );
      }
    }
    const requirements =
      body.requirements !== undefined
        ? jobCatalogOccupationRequirementsSchema.parse(body.requirements)
        : undefined;
    const row = await this.prisma.jobCatalogOccupation.update({
      where: { id },
      data: {
        code: body.code !== undefined ? code : undefined,
        title: body.title?.trim(),
        description: body.description,
        requirements,
        sortOrder: body.sortOrder,
        active: body.active,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_occupation_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_occupation',
      resourceId: id,
      requestId,
      metadata: body,
    });
    return this.mapOccupation(row);
  }

  async deleteSector(id: string, actorUserId: string, requestId: string) {
    const sector = await this.prisma.jobCatalogSector.findUnique({
      where: { id },
    });
    if (!sector) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Sektör bulunamadı.',
      );
    }
    const [jobRefs, workerRefs] = await Promise.all([
      this.prisma.job.count({ where: { sectorCode: sector.code } }),
      this.prisma.workerSector.count({ where: { sectorCode: sector.code } }),
    ]);
    if (jobRefs > 0 || workerRefs > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu sektör ilan veya işçi profillerinde kullanılıyor; silinemez.',
      );
    }
    await this.prisma.jobCatalogSector.delete({ where: { id } });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_sector_deleted',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_sector',
      resourceId: id,
      requestId,
      metadata: { code: sector.code },
    });
    return { deleted: true as const };
  }

  async deleteOccupation(id: string, actorUserId: string, requestId: string) {
    const row = await this.prisma.jobCatalogOccupation.findUnique({
      where: { id },
      include: { sector: true },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Pozisyon bulunamadı.',
      );
    }
    const [jobRefs, workerRefs] = await Promise.all([
      this.prisma.job.count({
        where: {
          sectorCode: row.sector.code,
          occupationCode: row.code,
        },
      }),
      this.prisma.workerOccupation.count({
        where: { occupationCode: row.code },
      }),
    ]);
    if (jobRefs > 0 || workerRefs > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'Bu pozisyon ilan veya işçi profillerinde kullanılıyor; silinemez.',
      );
    }
    await this.prisma.jobCatalogOccupation.delete({ where: { id } });
    await this.audit.append({
      category: 'admin',
      action: 'job_catalog_occupation_deleted',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'job_catalog_occupation',
      resourceId: id,
      requestId,
      metadata: { sectorId: row.sectorId, code: row.code },
    });
    return { deleted: true as const };
  }

  /** Legacy flat API for tests and scripts. */
  async createAdminItem(
    body: AdminJobCatalogCreateBody,
    actorUserId: string,
    requestId: string,
  ) {
    const sectorCode = body.sectorCode.trim().toLowerCase();
    if (!body.occupationCode) {
      return this.createSector(
        {
          code: sectorCode,
          displayName: body.title.trim(),
          sortOrder: body.sortOrder,
          active: body.active,
        },
        actorUserId,
        requestId,
      );
    }
    let sector = await this.prisma.jobCatalogSector.findUnique({
      where: { code: sectorCode },
    });
    if (!sector) {
      sector = await this.prisma.jobCatalogSector.create({
        data: {
          code: sectorCode,
          displayName: sectorCode,
          sortOrder: body.sortOrder ?? 0,
          active: body.active ?? true,
        },
      });
    }
    return this.createOccupation(
      sector.id,
      {
        code: body.occupationCode,
        title: body.title,
        sortOrder: body.sortOrder,
        active: body.active,
      },
      actorUserId,
      requestId,
    );
  }

  async patchAdminItem(
    id: string,
    body: AdminJobCatalogPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const occupation = await this.prisma.jobCatalogOccupation.findUnique({
      where: { id },
    });
    if (occupation) {
      return this.patchOccupation(
        id,
        {
          code: body.occupationCode ?? undefined,
          title: body.title,
          sortOrder: body.sortOrder,
          active: body.active,
        },
        actorUserId,
        requestId,
      );
    }
    const sector = await this.prisma.jobCatalogSector.findUnique({
      where: { id },
    });
    if (!sector) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Katalog kaydı bulunamadı.',
      );
    }
    return this.patchSector(
      id,
      {
        displayName: body.title,
        sortOrder: body.sortOrder,
        active: body.active,
      },
      actorUserId,
      requestId,
    );
  }
}
