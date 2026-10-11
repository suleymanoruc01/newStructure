import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Job required documents (e2e) T-045 T-066 T-067', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerAccess: string;
  let workerUserId: string;
  let workerSessionId: string;
  let workerProfileId: string;
  let branchId: string;

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

    const employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905578${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Belge Zorunlu AŞ',
        taxId: `3${Date.now().toString().slice(-9)}`,
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
    branchId = branch.id;
    const employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 't045-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;
    employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId: employer.id,
    }).accessToken;

    const worker = await prisma.user.create({
      data: { phoneE164: `+905579${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 't066-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Deniz',
        lastName: 'Belge',
        birthDate: new Date('1994-06-06'),
        gender: 'female',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: false,
      },
    });
    workerProfileId = profile.id;
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function workerBearer() {
    return tokens.signAccess(workerUserId, workerSessionId, { role: 'worker' })
      .accessToken;
  }

  it('stores required documents, hides the job until the worker has them, then shows it', async () => {
    const startsAt = new Date();
    startsAt.setUTCDate(startsAt.getUTCDate() + 3);
    startsAt.setUTCHours(12, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 4 * 3_600_000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `t045-${Date.now()}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Sağlık raporu şart',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        publish: true,
        requiredDocumentTypes: ['health_report'],
      });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body.data.requiredDocumentTypes).toEqual(['health_report']);
    const jobId = createRes.body.data.id as string;

    const stored = await prisma.job.findUnique({ where: { id: jobId } });
    expect(stored?.requiredDocumentTypes).toEqual(['health_report']);

    const hiddenFeed = await request(app.getHttpServer())
      .get('/api/v1/jobs/feed?limit=50')
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(hiddenFeed.status).toBe(200);
    expect(
      (hiddenFeed.body.data.items as { id: string }[]).some((row) => row.id === jobId),
    ).toBe(false);

    const applyRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({});
    expect(applyRes.status).toBe(422);
    expect(applyRes.body.error.code).toBe('JOB_NOT_APPLICABLE');

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.eligibility.eligible).toBe(false);
    expect(detailRes.body.data.eligibility.reasons).toContain('document_required');

    await prisma.workerDocument.create({
      data: {
        workerProfileId,
        documentType: 'health_report',
        fileName: 'saglik.pdf',
        contentType: 'application/pdf',
        sizeBytes: 11,
        storageKey: `t066-${workerProfileId}`,
        status: 'uploaded',
        uploadedAt: new Date(),
      },
    });

    const visibleFeed = await request(app.getHttpServer())
      .get('/api/v1/jobs/feed?limit=50')
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(visibleFeed.status).toBe(200);
    expect(
      (visibleFeed.body.data.items as { id: string }[]).some((row) => row.id === jobId),
    ).toBe(true);
  });
});
