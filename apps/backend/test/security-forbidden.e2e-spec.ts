import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Security resource scope (e2e) @T-244', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let userA: string;
  let userB: string;
  let sessionA: string;

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

    userA = (
      await prisma.user.create({
        data: { phoneE164: `+905566${Date.now().toString().slice(-7)}` },
      })
    ).id;
    userB = (
      await prisma.user.create({
        data: { phoneE164: `+905567${Date.now().toString().slice(-7)}` },
      })
    ).id;

    await prisma.workerProfile.create({
      data: {
        userId: userA,
        firstName: 'Ali',
        lastName: 'A',
        birthDate: new Date('1995-01-01'),
        gender: 'male',
        homeLatitude: 41,
        homeLongitude: 29,
      },
    });
    await prisma.workerProfile.create({
      data: {
        userId: userB,
        firstName: 'Ayşe',
        lastName: 'B',
        birthDate: new Date('1996-01-01'),
        gender: 'female',
        homeLatitude: 41,
        homeLongitude: 29,
      },
    });

    sessionA = (
      await prisma.refreshSession.create({
        data: {
          userId: userA,
          tokenHash: 'sec-a',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('worker cannot read another user worker profile via /workers/me scoped data', async () => {
    const access = tokens.signAccess(userA, sessionA, { role: 'worker' })
      .accessToken;

    const res = await request(app.getHttpServer())
      .get('/api/v1/employers/me')
      .set('Authorization', `Bearer ${access}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    const badEmployer = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${access}`);
    expect(badEmployer.status).toBe(403);
    expect(badEmployer.body.error.code).toBe('FORBIDDEN');
  });
});
