import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Shifts mock GPS (e2e) CASE-CHECKIN T-131', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let shiftId: string;
  let branchLat = 41.01;
  let branchLng = 28.98;

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
    tokens = moduleRef.get(TokenService);

    const worker = await prisma.user.create({
      data: { phoneE164: `+905569${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'mock-gps-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Veli',
        lastName: 'Can',
        birthDate: new Date('1993-01-01'),
        gender: 'male',
        homeLatitude: 41.0082,
        homeLongitude: 28.9784,
        nightShiftAvailable: false,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Mock GPS Employer',
        taxId: `5${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 20 },
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

    const startsAt = new Date(Date.now() + 10 * 60 * 1000);
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
        profileSnapshot: {
          firstName: 'Veli',
          capturedAt: new Date().toISOString(),
        },
      },
    });

    const shift = await prisma.shift.create({
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
    shiftId = shift.id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('rejects check-in when mockLocation is true', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    });

    const checkInRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/check-in`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .set('Idempotency-Key', `mock-gps-${shiftId}`)
      .send({
        latitude: branchLat,
        longitude: branchLng,
        accuracyM: 12,
        locationPermissionGranted: true,
        mockLocation: true,
      });

    expect(checkInRes.status).toBe(422);
    expect(checkInRes.body.error.code).toBe('MOCK_LOCATION_DETECTED');
  });
});
