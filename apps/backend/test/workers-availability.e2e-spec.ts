import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Workers availability (e2e) @T-016 @T-017', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;

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
      data: { phoneE164: `+905563${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'avail-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Ece',
        lastName: 'Yıldız',
        birthDate: new Date('1999-04-04'),
        gender: 'female',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: true,
      },
    });
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function bearer() {
    return tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;
  }

  it('PUT availability replaces windows and GET round-trips', async () => {
    const putRes = await request(app.getHttpServer())
      .put('/api/v1/workers/me/availability')
      .set('Authorization', `Bearer ${bearer()}`)
      .send({
        windows: [
          { dayOfWeek: 1, startMinute: 540, endMinute: 720 },
          { dayOfWeek: 1, startMinute: 780, endMinute: 900 },
        ],
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.windows).toHaveLength(2);

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/workers/me/availability')
      .set('Authorization', `Bearer ${bearer()}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.windows).toEqual(putRes.body.data.windows);
  });

  it('rejects overlapping windows on the same day', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/workers/me/availability')
      .set('Authorization', `Bearer ${bearer()}`)
      .send({
        windows: [
          { dayOfWeek: 2, startMinute: 540, endMinute: 800 },
          { dayOfWeek: 2, startMinute: 700, endMinute: 900 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AVAILABILITY_OVERLAP');
  });
});
