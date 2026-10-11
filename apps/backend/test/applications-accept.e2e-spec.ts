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

describe('Applications accept + notify (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let outbox: OutboxDrainService;
  let workerUserId: string;
  let employerUserId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let jobId: string;

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

    const workerPhone = `+905552${Date.now().toString().slice(-7)}`;
    const worker = await prisma.user.create({
      data: { phoneE164: workerPhone },
    });
    workerUserId = worker.id;
    const workerSession = await prisma.refreshSession.create({
      data: {
        userId: worker.id,
        tokenHash: 'worker-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activeContext: { role: 'worker' },
      },
    });
    workerSessionId = workerSession.id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        birthDate: new Date('1995-01-01'),
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

    const employerPhone = `+905553${Date.now().toString().slice(-7)}`;
    const employerUser = await prisma.user.create({
      data: { phoneE164: employerPhone },
    });
    employerUserId = employerUser.id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Apply Test Employer',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
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
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });

    const employerSession = await prisma.refreshSession.create({
      data: {
        userId: employerUserId,
        tokenHash: 'employer-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activeContext: { role: 'employer', employerId: employer.id },
      },
    });
    employerSessionId = employerSession.id;

    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 8 * 60 * 60 * 1000);
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
        headcount: 1,
        remainingHeadcount: 1,
        publishedAt: new Date(),
      },
    });
    jobId = job.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('apply → accept creates inbox + FCM delivery attempt', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    });
    const pushToken =
      'e2e-fcm-token-' + 'a'.repeat(32) + Date.now().toString().slice(-8);
    await request(app.getHttpServer())
      .post('/api/v1/devices/push-tokens')
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .send({ token: pushToken, platform: 'android', appVersion: '1.0.0' })
      .expect(204);

    const applyRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .set('Idempotency-Key', `apply-${jobId}-${workerUserId}`)
      .send({});
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.data.application.id as string;

    const employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId: (
        await prisma.employerMembership.findFirst({
          where: { userId: employerUserId },
        })
      )!.employerId,
    });

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/applications/${applicationId}/accept`)
      .set('Authorization', `Bearer ${employerAccess.accessToken}`)
      .set('Idempotency-Key', `accept-${applicationId}`);
    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.data.status).toBe('accepted');

    const pendingEvents = await prisma.outboxEvent.count({
      where: { status: 'pending' },
    });
    expect(pendingEvents).toBeGreaterThan(0);

    for (let i = 0; i < 10; i += 1) {
      await outbox.drainOnce();
    }

    const workerNotification = await prisma.notification.findFirst({
      where: {
        userId: workerUserId,
        type: 'application.accepted',
      },
    });
    expect(workerNotification).toBeTruthy();
    expect(workerNotification!.deliveryAttempts).toBeGreaterThan(0);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    expect(job?.status).toBe('closed');
    expect(job?.remainingHeadcount).toBe(0);

    const shift = await prisma.shift.findFirst({
      where: { jobId, workerUserId },
    });
    expect(shift).toBeTruthy();
  });
});
