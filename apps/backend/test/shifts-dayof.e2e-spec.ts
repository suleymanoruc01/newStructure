import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { OutboxDrainService } from '../src/notifications/outbox-drain.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Shifts day-of (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let outbox: OutboxDrainService;
  let workerUserId: string;
  let employerUserId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let employerId: string;
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
    outbox = moduleRef.get(OutboxDrainService);

    const worker = await prisma.user.create({
      data: { phoneE164: `+905554${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'w-hash',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Ali',
        lastName: 'Demir',
        birthDate: new Date('1994-01-01'),
        gender: 'male',
        homeLatitude: 41.0082,
        homeLongitude: 28.9784,
        nightShiftAvailable: false,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });

    employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905555${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Shift Test',
        taxId: `7${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 50 },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Merkez',
        latitude: branchLat,
        longitude: branchLng,
        city: 'İstanbul',
      },
    });
    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'e-hash',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;

    const startsAt = new Date(Date.now() + 10 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });
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
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    await prisma.tokenHold.create({
      data: {
        employerId: employer.id,
        jobId: job.id,
        amount: 2,
        status: 'held',
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        workerUserId: worker.id,
        workerProfileId: profile.id,
        status: 'accepted',
        profileSnapshot: { firstName: 'Ali', capturedAt: new Date().toISOString() },
      },
    });
    const confirmOpensAt = new Date(Date.now() - 60 * 1000);
    const shift = await prisma.shift.create({
      data: {
        applicationId: application.id,
        jobId: job.id,
        workerUserId: worker.id,
        employerId: employer.id,
        branchId: branch.id,
        status: 'awaiting_confirm',
        startsAt,
        endsAt,
        confirmOpensAt,
        confirmDeadlineAt: new Date(Date.now() + 30 * 60 * 1000),
        confirm3hNotifiedAt: new Date(),
      },
    });
    shiftId = shift.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('availability confirm can_come → check-in succeeds at branch', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    });

    const confirmRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/availability-confirm`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .send({ decision: 'can_come' });
    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.data.status).toBe('can_come');

    const checkInRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/check-in`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .set('Idempotency-Key', `checkin-${shiftId}`)
      .send({
        latitude: branchLat,
        longitude: branchLng,
        accuracyM: 12,
        locationPermissionGranted: true,
        mockLocation: false,
      });
    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.data.status).toBe('checked_in');

    for (let i = 0; i < 5; i += 1) {
      await outbox.drainOnce();
    }

    const employerNotification = await prisma.notification.findFirst({
      where: { type: 'shift.worker_checked_in' },
    });
    expect(employerNotification).toBeTruthy();

    const capture = await prisma.tokenLedgerEntry.findFirst({
      where: { type: 'capture', refId: shiftId },
    });
    expect(capture).toBeTruthy();
  });
});
