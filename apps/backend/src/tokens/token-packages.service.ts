import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import type {
  AdminTokenPackageCreateBody,
  AdminTokenPackagePatchBody,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SEED_PACKAGES = [
  { label: '10 jeton', tokenCount: 10, priceTry: 199, sortOrder: 0 },
  { label: '25 jeton', tokenCount: 25, priceTry: 449, discountPercent: 5, isPopular: true, sortOrder: 1 },
  { label: '50 jeton', tokenCount: 50, priceTry: 849, discountPercent: 8, sortOrder: 2 },
  { label: '100 jeton', tokenCount: 100, priceTry: 1599, discountPercent: 10, sortOrder: 3 },
  { label: '250 jeton', tokenCount: 250, priceTry: 3799, discountPercent: 15, sortOrder: 4 },
] as const;

@Injectable()
export class TokenPackagesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LegalAuditLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.tokenPackage.count();
    if (count > 0) {
      return;
    }
    await this.prisma.tokenPackage.createMany({
      data: SEED_PACKAGES.map((row) => ({
        label: row.label,
        tokenCount: row.tokenCount,
        priceTry: row.priceTry,
        discountPercent: 'discountPercent' in row ? row.discountPercent : 0,
        isPopular: 'isPopular' in row ? row.isPopular : false,
        sortOrder: row.sortOrder,
      })),
    });
  }

  private mapPackage(row: {
    id: string;
    label: string;
    tokenCount: number;
    priceTry: number;
    discountPercent: number;
    isPopular: boolean;
    isActive: boolean;
    sortOrder: number;
  }) {
    return {
      id: row.id,
      label: row.label,
      tokenCount: row.tokenCount,
      priceTry: row.priceTry,
      discountPercent: row.discountPercent,
      isPopular: row.isPopular,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    };
  }

  async listActivePublic() {
    const rows = await this.prisma.tokenPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      items: rows.map((row) => {
        const mapped = this.mapPackage(row);
        const { isActive: _a, ...rest } = mapped;
        return rest;
      }),
    };
  }

  async listAllAdmin() {
    const rows = await this.prisma.tokenPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { items: rows.map((row) => this.mapPackage(row)) };
  }

  async getActiveById(packageId: string) {
    const row = await this.prisma.tokenPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Jeton paketi bulunamadı.',
      );
    }
    return row;
  }

  async createAdmin(
    body: AdminTokenPackageCreateBody,
    actorUserId: string,
    requestId: string,
  ) {
    const row = await this.prisma.tokenPackage.create({
      data: {
        label: body.label,
        tokenCount: body.tokenCount,
        priceTry: body.priceTry,
        discountPercent: body.discountPercent ?? 0,
        isPopular: body.isPopular ?? false,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'token_package_created',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'token_package',
      resourceId: row.id,
      requestId,
    });
    return this.mapPackage(row);
  }

  async patchAdmin(
    id: string,
    body: AdminTokenPackagePatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.tokenPackage.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Jeton paketi bulunamadı.',
      );
    }
    const row = await this.prisma.tokenPackage.update({
      where: { id },
      data: body,
    });
    await this.audit.append({
      category: 'admin',
      action: 'token_package_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'token_package',
      resourceId: id,
      requestId,
      metadata: body,
    });
    return this.mapPackage(row);
  }
}
