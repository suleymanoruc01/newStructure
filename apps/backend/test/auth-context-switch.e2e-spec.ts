import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Auth context switch (e2e) AS-3', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let userId: string;
  let sessionId: string;
  let employerId: string;

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

    const user = await prisma.user.create({
      data: { phoneE164: `+905564${Date.now().toString().slice(-7)}` },
    });
    userId = user.id;

    await prisma.workerProfile.create({
      data: {
        userId: user.id,
        firstName: 'Dual',
        lastName: 'Role',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
      },
    });

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Dual Role AŞ',
        taxId: `3${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: user.id, employerId: employer.id, role: 'owner' },
    });

    sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: 'ctx-switch',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('lists contexts and switches to employer', async () => {
    const workerAccess = tokens.signAccess(userId, sessionId, {
      role: 'worker',
    }).accessToken;

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/auth/contexts')
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(2);

    const switchRes = await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${workerAccess}`)
      .send({ role: 'employer', employerId });
    expect([200, 201]).toContain(switchRes.status);
    expect(switchRes.body.data.accessToken).toBeTruthy();

    const employerAccess = switchRes.body.data.accessToken as string;
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me')
      .set('Authorization', `Bearer ${employerAccess}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(employerId);
  });
});
