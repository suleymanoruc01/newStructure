import { Injectable } from '@nestjs/common';

import { SmsService } from '../auth/sms.service.js';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ObjectStorageService } from '../storage/object-storage.service.js';
import { AdaptyService } from '../tokens/adapty.service.js';

@Injectable()
export class DevopsServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly storage: ObjectStorageService,
    private readonly sms: SmsService,
    private readonly adapty: AdaptyService,
  ) {}

  async aggregate() {
    const services: Array<{
      name: string;
      status: 'up' | 'degraded' | 'down';
      detail?: string;
    }> = [];

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.push({ name: 'postgres', status: 'up' });
    } catch (error) {
      services.push({
        name: 'postgres',
        status: 'down',
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await this.storage.ensureBucket();
      services.push({ name: 'object_storage', status: 'up' });
    } catch (error) {
      services.push({
        name: 'object_storage',
        status: 'degraded',
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    services.push({
      name: 'api',
      status: 'up',
      detail: `release=${this.config.env.PARTON_RELEASE}`,
    });

    const verimor = await this.sms.probe();
    services.push({
      name: verimor.name,
      status: verimor.status,
      detail: verimor.detail,
    });

    const adapty = await this.adapty.health();
    services.push({
      name: adapty.name,
      status: adapty.status,
      detail: adapty.detail,
    });

    try {
      const firebase = this.config.firebaseServiceAccount();
      services.push({
        name: 'fcm',
        status: 'up',
        detail: `project=${firebase.projectId}`,
      });
    } catch (error) {
      services.push({
        name: 'fcm',
        status: 'down',
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    if (this.config.env.BULLMQ_ENABLED && this.config.env.REDIS_QUEUE_URL) {
      services.push({
        name: 'redis',
        status: 'up',
        detail: 'BullMQ açık',
      });
    } else {
      services.push({
        name: 'redis',
        status: 'degraded',
        detail: 'BullMQ kapalı — Stage A outbox',
      });
    }

    const outboxPending = await this.prisma.outboxEvent.count({
      where: { status: 'pending' },
    });
    const outboxFailed = await this.prisma.outboxEvent.count({
      where: { status: 'failed' },
    });

    return { services, outboxPending, outboxFailed };
  }

  async overview() {
    const openErrorGroups = await this.prisma.devopsErrorGroup.count({
      where: { status: 'open' },
    });
    const aggregate = await this.aggregate();
    const unhealthyServices = aggregate.services.filter(
      (s) => s.status !== 'up',
    ).length;
    const latestReleases = await this.prisma.devopsRelease.findMany({
      orderBy: { builtAt: 'desc' },
      take: 8,
    });
    return {
      openErrorGroups,
      unhealthyServices,
      latestReleases: latestReleases.map((row) => ({
        id: row.id,
        app: row.app as 'api' | 'admin' | 'marketing' | 'mobile',
        version: row.version,
        gitSha: row.gitSha,
        environment: row.environment,
        builtAt: row.builtAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async clients() {
    const config = await this.prisma.remoteConfig.findUnique({
      where: { id: 'default' },
    });
    const apps = ['api', 'admin', 'marketing', 'mobile'] as const;
    const items = await Promise.all(
      apps.map(async (app) => {
        const latest = await this.prisma.devopsRelease.findFirst({
          where: { app },
          orderBy: { builtAt: 'desc' },
        });
        const openErrorGroups = await this.prisma.devopsErrorGroup.count({
          where: { app, status: 'open' },
        });
        let minVersion: string | null = null;
        if (app === 'mobile' && config) {
          minVersion =
            config.minMobileIosVersion ??
            config.minMobileAndroidVersion ??
            null;
        }
        return {
          app,
          latestRelease: latest?.version ?? null,
          minVersion,
          openErrorGroups,
        };
      }),
    );
    return { items };
  }
}
