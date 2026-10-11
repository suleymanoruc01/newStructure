import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Applications schedule overlap (e2e) @T-085 @T-181', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let employerUserId: string;
  let employerSessionId: string;
  let employerId: string;
  let jobAId: string;
  let jobBId: string;

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
      data: { phoneE164: `+905561${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'overlap-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Can',
        lastName: 'Demir',
        birthDate: new Date('1997-02-02'),
        gender: 'male',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: true,
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
        data: { phoneE164: `+905562${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Overlap Test',
        taxId: `4${Date.now().toString().slice(-9)}`,
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
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });
    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'overlap-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;

    const startsAt = new Date(Date.now() + 96 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    const jobA = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'İlan A',
        startsAt,
        endsAt,
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    jobAId = jobA.id;

    const jobB = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'İlan B',
        startsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
        endsAt: new Date(endsAt.getTime() + 60 * 60 * 1000),
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    jobBId = jobB.id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function workerBearer() {
    return tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;
  }

  function employerBearer() {
    return tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;
  }

  it('T-085: soft warn on apply without acknowledgeOverlap, then succeeds with ack', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobAId}/applications`)
      .set('Authorization', `Bearer ${workerBearer()}`)
      .set('Idempotency-Key', `overlap-a-${jobAId}`)
      .send({});
    expect(first.status).toBe(201);

    const warnRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobBId}/applications`)
      .set('Authorization', `Bearer ${workerBearer()}`)
      .set('Idempotency-Key', `overlap-b-${jobBId}`)
      .send({});
    expect(warnRes.status).toBe(409);
    expect(warnRes.body.error.code).toBe('SCHEDULE_OVERLAP_WARN');
    expect(warnRes.body.error.details?.length).toBeGreaterThan(0);
    expect(warnRes.body.error.details[0].jobId).toBe(jobAId);

    const okRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobBId}/applications`)
      .set('Authorization', `Bearer ${workerBearer()}`)
      .set('Idempotency-Key', `overlap-b-ack-${jobBId}`)
      .send({ acknowledgeOverlap: true });
    expect(okRes.status).toBe(201);
    expect(okRes.body.data.application.jobId).toBe(jobBId);
  });

  it('T-181: hard block second overlapping accept', async () => {
    const appB = await prisma.application.findFirst({
      where: { jobId: jobBId, workerUserId },
    });
    expect(appB).toBeTruthy();

    const acceptA = await request(app.getHttpServer())
      .post(`/api/v1/applications/${appB!.id}/accept`)
      .set('Authorization', `Bearer ${employerBearer()}`)
      .set('Idempotency-Key', `accept-b-${appB!.id}`);
    expect(acceptA.status).toBe(201);

    const appA = await prisma.application.findFirst({
      where: { jobId: jobAId, workerUserId },
    });
    expect(appA).toBeTruthy();

    const acceptBlocked = await request(app.getHttpServer())
      .post(`/api/v1/applications/${appA!.id}/accept`)
      .set('Authorization', `Bearer ${employerBearer()}`)
      .set('Idempotency-Key', `accept-a-block-${appA!.id}`);
    expect(acceptBlocked.status).toBe(409);
    expect(acceptBlocked.body.error.code).toBe('SCHEDULE_OVERLAP_BLOCK');
  });
});
