import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin time zone (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccess: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalFilters(moduleRef.get(ApiExceptionFilter));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    const tokens = moduleRef.get(TokenService);
    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905582${Date.now().toString().slice(-7)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-tz',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, sessionId, {
      role: 'admin',
    }).accessToken;
  }, 120_000);

  afterAll(async () => {
    await prisma.remoteConfig.update({
      where: { id: 'default' },
      data: { timeZone: 'Europe/Istanbul' },
    });
    await app?.close();
  });

  it('lets an admin set the IANA zone used for the civil clock', async () => {
    const before = await request(app.getHttpServer()).get(
      '/api/v1/platform/remote-config',
    );
    expect(before.status).toBe(200);
    expect(before.body.data.timeZone).toBe('Europe/Istanbul');

    const current = await prisma.remoteConfig.findUniqueOrThrow({
      where: { id: 'default' },
    });

    const invalid = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/remote')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        geofenceRadiusM: current.geofenceRadiusM,
        geofenceSoftRadiusM: current.geofenceSoftRadiusM,
        geofenceMaxAccuracyM: current.geofenceMaxAccuracyM,
        checkinEarlyMinutes: current.checkinEarlyMinutes,
        checkinLateMinutes: current.checkinLateMinutes,
        maintenanceMode: current.maintenanceMode,
        minMobileIosVersion: current.minMobileIosVersion,
        minMobileAndroidVersion: current.minMobileAndroidVersion,
        timeZone: 'Not/AZone',
      });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_FAILED');

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/remote')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        geofenceRadiusM: current.geofenceRadiusM,
        geofenceSoftRadiusM: current.geofenceSoftRadiusM,
        geofenceMaxAccuracyM: current.geofenceMaxAccuracyM,
        checkinEarlyMinutes: current.checkinEarlyMinutes,
        checkinLateMinutes: current.checkinLateMinutes,
        maintenanceMode: current.maintenanceMode,
        minMobileIosVersion: current.minMobileIosVersion,
        minMobileAndroidVersion: current.minMobileAndroidVersion,
        timeZone: 'America/New_York',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.timeZone).toBe('America/New_York');

    const after = await request(app.getHttpServer()).get(
      '/api/v1/platform/remote-config',
    );
    expect(after.body.data.timeZone).toBe('America/New_York');
  });
});
