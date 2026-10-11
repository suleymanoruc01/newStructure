import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { ObjectStorageService } from '../src/storage/object-storage.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Document ACL (e2e) T-249', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let ownerUserId: string;
  let ownerSessionId: string;
  let otherUserId: string;
  let otherSessionId: string;
  let adminUserId: string;
  let adminSessionId: string;

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
    await moduleRef.get(ObjectStorageService).ensureBucket();

    const owner = await prisma.user.create({
      data: { phoneE164: `+905575${Date.now().toString().slice(-7)}` },
    });
    ownerUserId = owner.id;
    ownerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: owner.id,
          tokenHash: 't249-owner',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    await prisma.workerProfile.create({
      data: {
        userId: owner.id,
        firstName: 'Eda',
        lastName: 'Belge',
        birthDate: new Date('1991-04-04'),
        gender: 'female',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: false,
      },
    });

    const other = await prisma.user.create({
      data: { phoneE164: `+905576${Date.now().toString().slice(-7)}` },
    });
    otherUserId = other.id;
    otherSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: other.id,
          tokenHash: 't249-other',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    await prisma.workerProfile.create({
      data: {
        userId: other.id,
        firstName: 'Kemal',
        lastName: 'Diger',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        homeLatitude: 41.02,
        homeLongitude: 28.99,
        nightShiftAvailable: false,
      },
    });

    const admin = await prisma.user.create({
      data: { phoneE164: `+905577${Date.now().toString().slice(-7)}` },
    });
    adminUserId = admin.id;
    await prisma.platformAdmin.create({
      data: { userId: admin.id, role: 'ops' },
    });
    adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: admin.id,
          tokenHash: 't249-admin',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function bearer(userId: string, sessionId: string, role: 'worker' | 'admin') {
    return tokens.signAccess(userId, sessionId, { role }).accessToken;
  }

  it('gives the owner a short-lived signed URL and denies everyone else', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/workers/me/documents')
      .set(
        'Authorization',
        `Bearer ${bearer(ownerUserId, ownerSessionId, 'worker')}`,
      )
      .send({
        documentType: 'health_report',
        fileName: 'saglik.pdf',
        contentType: 'application/pdf',
        sizeBytes: 11,
      });
    expect([200, 201]).toContain(createRes.status);
    const { id, uploadUrl } = createRes.body.data as {
      id: string;
      uploadUrl: string;
    };
    expect(uploadUrl).toContain('X-Amz-Algorithm');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: Buffer.from('%PDF-test'),
    });
    expect(putRes.ok).toBe(true);

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/workers/me/documents/${id}/complete`)
      .set(
        'Authorization',
        `Bearer ${bearer(ownerUserId, ownerSessionId, 'worker')}`,
      );
    expect([200, 201]).toContain(completeRes.status);

    const anon = await request(app.getHttpServer()).get(
      `/api/v1/workers/me/documents/${id}/download-url`,
    );
    expect(anon.status).toBe(401);

    const otherRes = await request(app.getHttpServer())
      .get(`/api/v1/workers/me/documents/${id}/download-url`)
      .set(
        'Authorization',
        `Bearer ${bearer(otherUserId, otherSessionId, 'worker')}`,
      );
    expect(otherRes.status).toBe(403);
    expect(otherRes.body.error.code).toBe('FORBIDDEN');

    const ownerRes = await request(app.getHttpServer())
      .get(`/api/v1/workers/me/documents/${id}/download-url`)
      .set(
        'Authorization',
        `Bearer ${bearer(ownerUserId, ownerSessionId, 'worker')}`,
      );
    expect(ownerRes.status).toBe(200);
    const downloadUrl = ownerRes.body.data.downloadUrl as string;
    expect(downloadUrl).toContain('X-Amz-Algorithm');
    const expiresAt = new Date(ownerRes.body.data.expiresAt as string);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 900_000 + 5_000);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const rawUrl = downloadUrl.split('?')[0] ?? downloadUrl;
    const rawRes = await fetch(rawUrl);
    expect(rawRes.status).toBe(403);

    const signedRes = await fetch(downloadUrl);
    expect(signedRes.ok).toBe(true);

    const queueRes = await request(app.getHttpServer())
      .get('/api/v1/admin/documents')
      .set(
        'Authorization',
        `Bearer ${bearer(adminUserId, adminSessionId, 'admin')}`,
      );
    expect(queueRes.status).toBe(200);
    expect(
      (queueRes.body.data.items as { id: string }[]).some((row) => row.id === id),
    ).toBe(true);
  });
});
