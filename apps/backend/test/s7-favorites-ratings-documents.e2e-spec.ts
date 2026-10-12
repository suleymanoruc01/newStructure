import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { collectFeedJobIds } from './feed-pages.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { ObjectStorageService } from '../src/storage/object-storage.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('S7 favorites, ratings, documents (e2e) @T-022 @T-023 @T-024 @T-176', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let storage: ObjectStorageService;

  let workerUserId: string;
  let employerUserId: string;
  let employerId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let shiftId: string;

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
    storage = moduleRef.get(ObjectStorageService);
    await storage.ensureBucket();

    const worker = await prisma.user.create({
      data: { phoneE164: `+905551${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 's7-worker',
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
        birthDate: new Date('1995-05-05'),
        gender: 'female',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: new Date().getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905552${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'S7 Test AŞ',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 's7-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 100 },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Şube',
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });

    const employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId: employer.id,
    }).accessToken;

    const favRes = await request(app.getHttpServer())
      .post('/api/v1/favorites')
      .set('Authorization', `Bearer ${employerAccess}`)
      .send({ type: 'worker', id: workerUserId });
    expect(favRes.status).toBe(201);

    const startsAt = new Date(Date.now() + 86_400_000);
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
        title: 'Favori ilan',
        startsAt,
        endsAt,
        headcount: 1,
        remainingHeadcount: 1,
        favoritesOnly: true,
        publishedAt: new Date(),
      },
    });

    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;

    const feedIds = await collectFeedJobIds(app, workerAccess);
    expect(feedIds).toContain(job.id);

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        workerUserId,
        workerProfileId: profile.id,
        status: 'accepted',
        profileSnapshot: {},
      },
    });
    const shift = await prisma.shift.create({
      data: {
        applicationId: application.id,
        jobId: job.id,
        workerUserId,
        employerId: employer.id,
        branchId: branch.id,
        status: 'checked_in',
        startsAt: job.startsAt,
        endsAt: job.endsAt,
        confirmOpensAt: new Date(Date.now() - 3600_000),
        confirmDeadlineAt: new Date(Date.now() - 1800_000),
        checkedInAt: new Date(),
        attendanceConfirmedAt: new Date(),
        ratingOpensAt: new Date(Date.now() - 60_000),
      },
    });
    shiftId = shift.id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  });

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

  it('rejects invalid document MIME before storage', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/workers/me/documents')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({
        documentType: 'id_card',
        fileName: 'evil.exe',
        contentType: 'application/x-msdownload',
        sizeBytes: 1024,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DOCUMENT');
  });

  it('rejects oversized documents before storage', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/workers/me/documents')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({
        documentType: 'id_card',
        fileName: 'huge.pdf',
        contentType: 'application/pdf',
        sizeBytes: 20_000_000,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DOCUMENT_TOO_LARGE');
  });

  it('uploads a document via presigned PUT and completes', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/workers/me/documents')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({
        documentType: 'health_report',
        fileName: 'saglik.pdf',
        contentType: 'application/pdf',
        sizeBytes: 11,
      });
    expect(createRes.status).toBe(201);
    const { id, uploadUrl } = createRes.body.data as {
      id: string;
      uploadUrl: string;
    };
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: Buffer.from('%PDF-test'),
    });
    expect(putRes.ok).toBe(true);

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/workers/me/documents/${id}/complete`)
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(completeRes.status).toBe(201);
    expect(completeRes.body.data.status).toBe('uploaded');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/workers/me/documents')
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(listRes.status).toBe(200);
    expect(
      (listRes.body.data.items as { documentType: string; status: string }[]).some(
        (row) =>
          row.documentType === 'health_report' && row.status === 'uploaded',
      ),
    ).toBe(true);
  });

  it('creates a rating and blocks duplicate with 409', async () => {
    const pendingRes = await request(app.getHttpServer())
      .get('/api/v1/ratings/pending')
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(pendingRes.status).toBe(200);
    expect(
      (pendingRes.body.data.items as { shiftId: string }[]).some(
        (i) => i.shiftId === shiftId,
      ),
    ).toBe(true);

    const rateRes = await request(app.getHttpServer())
      .post('/api/v1/ratings')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({ shiftId, score: 5, comment: 'Harika işveren' });
    expect(rateRes.status).toBe(201);

    const dupRes = await request(app.getHttpServer())
      .post('/api/v1/ratings')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({ shiftId, score: 4 });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('CONFLICT');
  });

  it('queues profanity in rating comment', async () => {
    const rateRes = await request(app.getHttpServer())
      .post('/api/v1/ratings')
      .set('Authorization', `Bearer ${employerBearer()}`)
      .send({ shiftId, score: 3, comment: 'orospu davranış' });
    expect(rateRes.status).toBe(201);
    expect(rateRes.body.data.moderationStatus).toBe('queued');
  });
});
