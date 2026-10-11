import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Shifts dispute and manual confirm (e2e) @T-134 @T-135', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let employerUserId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let employerId: string;
  let adminAccess: string;
  let shiftId: string;
  const branchLat = 41.01;
  const branchLng = 28.98;

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
      data: { phoneE164: `+905556${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'w-dispute',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        birthDate: new Date('1994-01-01'),
        gender: 'female',
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
        data: { phoneE164: `+905557${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Dispute Test AŞ',
        taxId: `7${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id, role: 'owner' },
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
    const admin = await prisma.user.create({
      data: { phoneE164: `+905558${Date.now().toString().slice(-7)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: admin.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: admin.id,
          tokenHash: 'a-dispute',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(admin.id, adminSessionId, {
      role: 'admin',
    }).accessToken;

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'e-dispute',
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
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        status: 'published',
        title: 'Garson',
        startsAt,
        endsAt,
        headcount: 1,
        remainingHeadcount: 1,
        payCurrency: 'TRY',
        publishedAt: new Date(),
      },
    });
    await prisma.tokenHold.create({
      data: {
        employerId: employer.id,
        jobId: job.id,
        amount: 1,
        status: 'held',
      },
    });
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        workerUserId: worker.id,
        workerProfileId: profile.id,
        status: 'accepted',
        profileSnapshot: {
          firstName: 'Ayşe',
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
      },
    });
    shiftId = shift.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('failed check-in → dispute → employer manual confirm', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;
    const employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;

    const checkInRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/check-in`)
      .set('Authorization', `Bearer ${workerAccess}`)
      .set('Idempotency-Key', `checkin-fail-${shiftId}`)
      .send({
        latitude: 40.5,
        longitude: 27.5,
        accuracyM: 12,
        locationPermissionGranted: true,
        mockLocation: false,
      });
    expect(checkInRes.status).toBe(422);

    const disputeRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/disputes`)
      .set('Authorization', `Bearer ${workerAccess}`)
      .send({
        note: 'Şubede olduğum halde GPS hatası aldım, lütfen kontrol edin.',
      });
    expect([200, 201]).toContain(disputeRes.status);
    expect(disputeRes.body.data.status).toBe('open');
    const disputeId = disputeRes.body.data.id as string;

    const disputeNotice = await prisma.notification.findFirst({
      where: {
        userId: employerUserId,
        type: 'shift.dispute_update',
        dedupeKey: `shift.dispute_update:${disputeId}:${employerUserId}`,
      },
    });
    expect(disputeNotice).toBeTruthy();
    const disputeOutbox = await prisma.outboxEvent.findFirst({
      where: {
        type: 'notification.dispatch',
        payload: { path: ['notificationId'], equals: disputeNotice!.id },
      },
    });
    expect(disputeOutbox).toBeTruthy();

    const adminQueue = await request(app.getHttpServer())
      .get('/api/v1/admin/disputes')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(adminQueue.status).toBe(200);
    const queuedIds = (adminQueue.body.data.items as { id: string }[]).map(
      (item) => item.id,
    );
    expect(queuedIds).toContain(disputeId);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/shifts/employer/open-disputes')
      .set('Authorization', `Bearer ${employerAccess}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);

    const manualRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shiftId}/manual-confirm`)
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `manual-${shiftId}`);
    expect([200, 201]).toContain(manualRes.status);
    expect(manualRes.body.data.status).toBe('manual_confirmed');

    const confirmNotice = await prisma.notification.findFirst({
      where: {
        userId: workerUserId,
        type: 'shift.manual_confirmed',
        dedupeKey: `shift.manual_confirmed:${shiftId}`,
      },
    });
    expect(confirmNotice).toBeTruthy();
    const confirmOutbox = await prisma.outboxEvent.findFirst({
      where: {
        type: 'notification.dispatch',
        payload: { path: ['notificationId'], equals: confirmNotice!.id },
      },
    });
    expect(confirmOutbox).toBeTruthy();

    const capture = await prisma.tokenLedgerEntry.findFirst({
      where: { type: 'capture', refId: shiftId },
    });
    expect(capture).toBeTruthy();
  });
});
