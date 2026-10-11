import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Apply rate limit (e2e) T-186', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let extraJobId: string;
  const replayKey = `t186-replay-${Date.now()}`;

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
      data: { phoneE164: `+905574${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 't186-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Bot',
        lastName: 'Aday',
        birthDate: new Date('1992-02-02'),
        gender: 'male',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: true,
      },
    });

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Rate Limit AŞ',
        taxId: `4${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
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

    const startsAt = new Date(Date.now() + 48 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 4 * 3_600_000);
    for (let i = 0; i < 11; i += 1) {
      const job = await prisma.job.create({
        data: {
          employerId: employer.id,
          branchId: branch.id,
          status: 'published',
          sectorCode: 'hospitality',
          startsAt: new Date(startsAt.getTime() + i * 86_400_000),
          endsAt: new Date(endsAt.getTime() + i * 86_400_000),
          headcount: 1,
          remainingHeadcount: 1,
          publishedAt: new Date(),
        },
      });
      if (i < 10) {
        await prisma.application.create({
          data: {
            jobId: job.id,
            workerUserId: worker.id,
            workerProfileId: profile.id,
            status: 'pending',
            profileSnapshot: { firstName: 'Bot', capturedAt: new Date().toISOString() },
            idempotencyKey: i === 0 ? replayKey : undefined,
          },
        });
      } else {
        extraJobId = job.id;
      }
    }
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function bearer() {
    return tokens.signAccess(workerUserId, workerSessionId, { role: 'worker' })
      .accessToken;
  }

  it('returns 429 RATE_LIMITED after the apply window is full and records bot_apply', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${extraJobId}/applications`)
      .set('Authorization', `Bearer ${bearer()}`)
      .send({});
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');

    const risk = await prisma.riskEvent.findFirst({
      where: { userId: workerUserId, type: 'bot_apply' },
    });
    expect(risk).toBeTruthy();
  });

  it('still returns the original application for the same idempotency key', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${extraJobId}/applications`)
      .set('Authorization', `Bearer ${bearer()}`)
      .set('Idempotency-Key', replayKey)
      .send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.application.workerUserId).toBe(workerUserId);
  });
});
