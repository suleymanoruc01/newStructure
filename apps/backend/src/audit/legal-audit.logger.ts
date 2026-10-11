import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

export type LegalAuditAppendInput = {
  category: string;
  action: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class LegalAuditLogger {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: LegalAuditAppendInput): Promise<void> {
    await this.prisma.legalAuditEvent.create({
      data: {
        category: input.category,
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        requestId: input.requestId ?? null,
        ipHash: input.ipHash ?? null,
        metadata: input.metadata ?? {},
      },
    });
  }
}
