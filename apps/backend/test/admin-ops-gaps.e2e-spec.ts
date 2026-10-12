import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin ops gaps (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let adminAccess: string;
  let employerId: string;
  let applicationId: string;
  let jobId: string;
  let workerUserId: string;
  let workerProfileId: string;
  let branchId: string;
  let documentId: string;
  let shiftId: string;
  let disputeId: string;

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

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905556${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-ops-gaps',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, adminSessionId, {
      role: 'admin',
    }).accessToken;

    const worker = await prisma.user.create({
      data: { phoneE164: `+905557${Date.now().toString().slice(-6)}` },
    });
    workerUserId = worker.id;
    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Test',
        lastName: 'Worker',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        homeLatitude: 41,
        homeLongitude: 29,
        nightShiftAvailable: false,
      },
    });
    workerProfileId = profile.id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Eski Ünvan AŞ',
        taxId: `9${Date.now().toString().slice(-10)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Şube',
        latitude: 41.01,
        longitude: 28.98,
      },
    });
    branchId = branch.id;
    const startsAt = new Date(Date.now() + 72 * 3600000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3600000);
    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Test ilan',
        startsAt,
        endsAt,
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        workerUserId: worker.id,
        workerProfileId: profile.id,
        status: 'pending',
        profileSnapshot: {
          firstName: 'Test',
          lastName: 'Worker',
          sectorCodes: [],
          occupationCodes: [],
          capturedAt: new Date().toISOString(),
        },
      },
    });
    applicationId = application.id;
    jobId = job.id;

    const document = await prisma.workerDocument.create({
      data: {
        workerProfileId: profile.id,
        documentType: 'id_card',
        fileName: 'id.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1200,
        storageKey: `e2e-doc-${Date.now()}`,
        status: 'uploaded',
        uploadedAt: new Date(),
      },
    });
    documentId = document.id;

    const shift = await prisma.shift.create({
      data: {
        applicationId: application.id,
        jobId: job.id,
        workerUserId: worker.id,
        employerId: employer.id,
        branchId: branch.id,
        status: 'scheduled',
        startsAt,
        endsAt,
        confirmOpensAt: new Date(),
        confirmDeadlineAt: new Date(Date.now() + 3600000),
      },
    });
    shiftId = shift.id;

    const dispute = await prisma.checkInDispute.create({
      data: {
        shiftId: shift.id,
        workerUserId: worker.id,
        note: 'Check-in reddedildi',
        status: 'open',
      },
    });
    disputeId = dispute.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('PATCH /admin/employers/:id updates legalName', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/employers/${employerId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ legalName: 'Yeni Ünvan AŞ' });
    expect(res.status).toBe(200);
    expect(res.body.data.legalName).toBe('Yeni Ünvan AŞ');
  });

  it('POST /admin/tokens/packages creates a package', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/tokens/packages')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        label: `E2E Paket ${Date.now()}`,
        tokenCount: 25,
        priceTry: 500,
        sortOrder: 99,
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.tokenCount).toBe(25);
  });

  it('PATCH /admin/applications/:id rejects pending application', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/applications/${applicationId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        status: 'rejected',
        reason: 'Destek: yanlış başvuru',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  it('GET /admin/matching/diagnostics explains night-shift and favorites-only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/matching/diagnostics')
      .query({ jobId, workerUserId })
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.jobFavoritesOnly).toBe(false);
    expect(res.body.data.workerNightShiftAvailable).toBe(false);
    expect(res.body.data).toHaveProperty('reasons');
  });

  it('GET /admin/jobs lists favoritesOnly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/jobs')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(
      (res.body.data.items as { id: string; favoritesOnly: boolean }[]).some(
        (row) => row.id === jobId && row.favoritesOnly === false,
      ),
    ).toBe(true);
  });

  it('GET /admin/employers/:id and /admin/jobs/:id return flat ops fields', async () => {
    const employer = await request(app.getHttpServer())
      .get(`/api/v1/admin/employers/${employerId}`)
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(employer.status).toBe(200);
    expect(employer.body.data.legalName).toBe('Yeni Ünvan AŞ');
    expect(employer.body.data.employer).toBeUndefined();
    expect(employer.body.data.tokenBalance).toBeDefined();

    const job = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${jobId}`)
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(job.status).toBe(200);
    expect(job.body.data.employerName).toBe('Yeni Ünvan AŞ');
    expect(job.body.data.favoritesOnly).toBe(false);
    expect(job.body.data.employer).toBeUndefined();
    expect(Array.isArray(job.body.data.applications)).toBe(true);
  });

  it('PATCH /admin/jobs/:id rejects empty favorites-only audience', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/jobs/${jobId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ favoritesOnly: true });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('FAVORITES_AUDIENCE_EMPTY');
  });

  it('PATCH /admin/workers/:id sets nightShiftAvailable', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/workers/${workerProfileId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ nightShiftAvailable: true });
    expect(res.status).toBe(200);
    expect(res.body.data.nightShiftAvailable).toBe(true);
  });

  it('PATCH /admin/documents/:id rejects uploaded document', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/documents/${documentId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  it('POST /admin/shifts/:id/manual-confirm confirms attendance', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/shifts/${shiftId}/manual-confirm`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.status).toBe('manual_confirmed');
    expect(res.body.data.branchId).toBe(branchId);
  });

  it('PATCH /admin/disputes/:id resolves without extra confirm', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/disputes/${disputeId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('resolved');
  });

  it('POST /admin/users/:id/sessions/revoke closes sessions', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/users/${workerUserId}/sessions/revoke`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.sessionsRevoked).toBe(true);
  });
});
