import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

const SEED_ITEMS = [
  { sectorCode: 'hospitality', occupationCode: 'waiter', title: 'Garson' },
  { sectorCode: 'hospitality', occupationCode: 'kitchen', title: 'Mutfak' },
  { sectorCode: 'retail', occupationCode: 'cashier', title: 'Kasiyer' },
  { sectorCode: 'retail', occupationCode: 'stocker', title: 'Reyon' },
  { sectorCode: 'logistics', occupationCode: 'picker', title: 'Depo' },
];

@Injectable()
export class JobCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.jobCatalogItem.count();
    if (count > 0) {
      return;
    }
    await this.prisma.jobCatalogItem.createMany({
      data: SEED_ITEMS.map((item, index) => ({
        sectorCode: item.sectorCode,
        occupationCode: item.occupationCode,
        title: item.title,
        sortOrder: index,
      })),
    });
  }

  async listActive() {
    const items = await this.prisma.jobCatalogItem.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      items: items.map((row) => ({
        id: row.id,
        sectorCode: row.sectorCode,
        occupationCode: row.occupationCode,
        title: row.title,
      })),
    };
  }
}
