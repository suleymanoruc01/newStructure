import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Substitute applications + shift incidents (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let employerUserId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let employerId: string;
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

    const worker = await prisma.user.create({
      data: { phoneE164: `+905552${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    const workerSession = await prisma.refreshSession.create({
      data: {
        userId: worker.id,
        tokenHash: 'sub-worker-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activeContext: { role: 'worker' },
      },
    });
    workerSessionId = workerSession.id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Deniz',
        lastName: 'Yedek',
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

    const employerUser = await prisma.user.create({
      data: { phoneE164: `+905553${Date.now().toString().slice(-7)}` },
    });
    employerUserId = employerUser.id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Substitute Test Employer',
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
        name: 'Kadıköy',
        latitude: 40.99,
        longitude: 29.03,
        city: 'İstanbul',
      },
    });
    const employerSession = await prisma.refreshSession.create({
      data: {
        userId: employerUserId,
        tokenHash: 'sub-employer-hash',
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
        title: 'Garson yedek',
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

  it('moves pending to substitute without consuming headcount, then accepts', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    });
    const employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    });

    const applyRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .set('Idempotency-Key', `apply-sub-${jobId}`)
      .send({});
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.data.application.id as string;

    const subRes = await request(app.getHttpServer())
      .post(`/api/v1/applications/${applicationId}/substitute`)
      .set('Authorization', `Bearer ${employerAccess.accessToken}`);
    expect(subRes.status).toBe(201);
    expect(subRes.body.data.status).toBe('substitute');

    const afterSub = await prisma.job.findUnique({ where: { id: jobId } });
    expect(afterSub?.remainingHeadcount).toBe(1);

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/applications/${applicationId}/accept`)
      .set('Authorization', `Bearer ${employerAccess.accessToken}`)
      .set('Idempotency-Key', `accept-sub-${applicationId}`);
    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.data.status).toBe('accepted');

    const afterAccept = await prisma.job.findUnique({ where: { id: jobId } });
    expect(afterAccept?.remainingHeadcount).toBe(0);

    const shift = await prisma.shift.findFirst({
      where: { jobId, workerUserId },
    });
    expect(shift).toBeTruthy();

    const incidentRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shift!.id}/incidents`)
      .set('Authorization', `Bearer ${workerAccess.accessToken}`)
      .send({ type: 'workplace_closed', severity: 'high' });
    expect(incidentRes.status).toBe(201);
    expect(incidentRes.body.data.type).toBe('workplace_closed');
  });

  it('rejects restricted accounts on authenticated routes', async () => {
    const restricted = await prisma.user.create({
      data: {
        phoneE164: `+905554${Date.now().toString().slice(-7)}`,
        status: 'restricted',
      },
    });
    const session = await prisma.refreshSession.create({
      data: {
        userId: restricted.id,
        tokenHash: 'restricted-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activeContext: { role: 'worker' },
      },
    });
    const access = tokens.signAccess(restricted.id, session.id, {
      role: 'worker',
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${access.accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_RESTRICTED');
  });
});
