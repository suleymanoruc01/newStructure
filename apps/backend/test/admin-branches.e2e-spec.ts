import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin branches (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let adminAccess: string;
  let employerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    tokens = moduleRef.get(TokenService);

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905556${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-branches',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, sessionId, {
      role: 'admin',
    }).accessToken;

    employerId = (
      await prisma.employer.create({
        data: {
          legalName: 'Şube Test AŞ',
          taxId: `${Date.now()}`.slice(-11).padStart(11, '2'),
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /admin/branches creates branch for employer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/branches')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        employerId,
        name: 'Merkez',
        city: 'İstanbul',
        latitude: 41.01,
        longitude: 28.97,
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.employerId).toBe(employerId);
    expect(res.body.data.managerInviteCode).toBeDefined();

    const patch = await request(app.getHttpServer())
      .patch(`/api/v1/admin/branches/${res.body.data.id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ name: 'Merkez Şube', status: 'active' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.name).toBe('Merkez Şube');
  });

  it('POST /admin/branches rejects a missing workplace', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/branches')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        employerId: '00000000-0000-4000-8000-000000000001',
        name: 'Merkez',
        city: 'İstanbul',
        latitude: 41.01,
        longitude: 28.97,
      });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
