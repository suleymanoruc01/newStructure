import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

const DEFAULT_POLICIES = [
  {
    slug: 'privacy',
    title: 'Gizlilik Politikası',
    version: '2026-10-01',
    required: true,
  },
  {
    slug: 'terms',
    title: 'Kullanım Koşulları',
    version: '2026-10-01',
    required: true,
  },
];

@Injectable()
export class PoliciesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    for (const policy of DEFAULT_POLICIES) {
      await this.prisma.policyDocument.upsert({
        where: { slug: policy.slug },
        create: policy,
        update: {
          title: policy.title,
          version: policy.version,
          required: policy.required,
        },
      });
    }
  }

  async listPendingPolicies(userId: string) {
    const accepted = await this.prisma.policyAcceptance.findMany({
      where: { userId },
      select: { policyId: true },
    });
    const acceptedIds = new Set(accepted.map((row) => row.policyId));
    const items = await this.prisma.policyDocument.findMany({
      orderBy: { slug: 'asc' },
    });
    return {
      items: items
        .filter((p) => !acceptedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          version: p.version,
          required: p.required,
          contentUrl: p.contentUrl ?? undefined,
        })),
    };
  }

  async acceptPolicies(userId: string, policyIds: string[]) {
    const now = new Date();
    await this.prisma.$transaction(
      policyIds.map((policyId) =>
        this.prisma.policyAcceptance.upsert({
          where: { userId_policyId: { userId, policyId } },
          create: { userId, policyId, acceptedAt: now },
          update: { acceptedAt: now },
        }),
      ),
    );
    return { acceptedAt: now.toISOString() };
  }
}
