import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin check-in limits (e2e) T-127 T-129 T-130', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let workerAccess: string;
  let earlyShiftId: string;
  let lateShiftId: string;
  let driftShiftId: string;
  const branchLat = 41.02;
  const branchLng = 28.97;

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
    const worker = await prisma.user.create({
      data: { phoneE164: `+905570${Date.now().toString().slice(-7)}` },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'checkin-limits-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    workerAccess = tokens.signAccess(worker.id, sessionId, {
      role: 'worker',
    }).accessToken;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Deniz',
        lastName: 'Ak',
        birthDate: new Date('1994-04-04'),
        gender: 'female',
        homeLatitude: branchLat,
        homeLongitude: branchLng,
        nightShiftAvailable: false,
      },
    });
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Check-in Limits Employer',
        taxId: `6${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Şube',
        latitude: branchLat,
        longitude: branchLng,
        city: 'İstanbul',
      },
    });

    async function seedShift(startsAt: Date) {
      const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
      const job = await prisma.job.create({
        data: {
          employerId: employer.id,
          branchId: branch.id,
          status: 'published',
          sectorCode: 'hospitality',
          occupationCode: 'waiter',
          title: 'Garson',
          startsAt,
          endsAt,
          headcount: 1,
          remainingHeadcount: 1,
          publishedAt: new Date(),
        },
      });
      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          workerUserId: worker.id,
          workerProfileId: profile.id,
          status: 'accepted',
          profileSnapshot: { firstName: 'Deniz' },
        },
      });
      return prisma.shift.create({
        data: {
          applicationId: application.id,
          jobId: job.id,
          workerUserId: worker.id,
          employerId: employer.id,
          branchId: branch.id,
          status: 'can_come',
          startsAt,
          endsAt,
          confirmOpensAt: new Date(Date.now() - 60 * 1000),
          confirmDeadlineAt: new Date(Date.now() + 30 * 60 * 1000),
          confirm3hNotifiedAt: new Date(),
          availabilityDecision: 'can_come',
        },
      });
    }

    earlyShiftId = (
      await seedShift(new Date(Date.now() + 10 * 60 * 1000))
    ).id;
    lateShiftId = (
      await seedShift(new Date(Date.now() - 10 * 60 * 1000))
    ).id;
    driftShiftId = (await seedShift(new Date())).id;
  }, 120_000);

  afterAll(async () => {
    await prisma.remoteConfig.update({
      where: { id: 'default' },
      data: {
        geofenceMaxAccuracyM: 30,
        checkinEarlyMinutes: 15,
        checkinLateMinutes: 30,
      },
    });
    await app?.close();
  }, 30_000);

  async function checkIn(shiftId: string, accuracyM: number) {
    return request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/check-in`)
      .set('Authorization', `Bearer ${workerAccess}`)
      .set('Idempotency-Key', `limits-${shiftId}`)
      .send({
        latitude: branchLat,
        longitude: branchLng,
        accuracyM,
        locationPermissionGranted: true,
        mockLocation: false,
      });
  }

  it('rejects a check-in earlier than the admin early window', async () => {
    await prisma.remoteConfig.update({
      where: { id: 'default' },
      data: { checkinEarlyMinutes: 5 },
    });
    try {
      const res = await checkIn(earlyShiftId, 12);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CHECKIN_WINDOW_CLOSED');
    } finally {
      await prisma.remoteConfig.update({
        where: { id: 'default' },
        data: { checkinEarlyMinutes: 15 },
      });
    }
  });

  it('rejects a check-in later than the admin late window', async () => {
    await prisma.remoteConfig.update({
      where: { id: 'default' },
      data: { checkinLateMinutes: 5 },
    });
    try {
      const res = await checkIn(lateShiftId, 12);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CHECKIN_WINDOW_CLOSED');
    } finally {
      await prisma.remoteConfig.update({
        where: { id: 'default' },
        data: { checkinLateMinutes: 30 },
      });
    }
  });

  it('records a soft pass when GPS drift exceeds the admin accuracy limit', async () => {
    await prisma.remoteConfig.update({
      where: { id: 'default' },
      data: { geofenceMaxAccuracyM: 20 },
    });
    try {
      const res = await checkIn(driftShiftId, 25);
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('checked_in');
      const row = await prisma.checkIn.findFirst({
        where: { shiftId: driftShiftId, success: true },
      });
      expect(row?.softPass).toBe(true);
    } finally {
      await prisma.remoteConfig.update({
        where: { id: 'default' },
        data: { geofenceMaxAccuracyM: 30 },
      });
    }
  });
});
