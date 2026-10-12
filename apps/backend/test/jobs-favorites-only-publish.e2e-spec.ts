import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { collectFeedJobIds } from './feed-pages.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Favorites-only job publish (e2e) T-056 T-168 T-216', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerUserId: string;
  let employerSessionId: string;
  let employerId: string;
  let branchId: string;
  let workerUserId: string;
  let workerSessionId: string;
  let employerAccessToken: string;

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

    employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905567${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Fav Publish AŞ',
        taxId: `7${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId, balance: 50 },
    });

    const branch = await prisma.branch.create({
      data: {
        employerId,
        name: 'Merkez',
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });
    branchId = branch.id;

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 't056-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;

    employerAccessToken = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;

    const worker = await prisma.user.create({
      data: { phoneE164: `+905568${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 't056-worker',
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
        nightShiftAvailable: true,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });

    const favRes = await request(app.getHttpServer())
      .post('/api/v1/favorites')
      .set('Authorization', `Bearer ${employerAccessToken}`)
      .send({ type: 'worker', id: workerUserId });
    expect(favRes.status).toBe(201);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('POST /api/v1/jobs publish favoritesOnly → favorited worker sees job and inbox notify', async () => {
    const startsAt = new Date(Date.now() + 72 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: (
          await prisma.workerProfile.findFirstOrThrow({
            where: { userId: workerUserId },
          })
        ).id,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccessToken}`)
      .set('Idempotency-Key', `t056-${Date.now()}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Sadece favoriler',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 45_000,
        publish: true,
        favoritesOnly: true,
      });

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body.data.status).toBe('published');
    expect(createRes.body.data.favoritesOnly).toBe(true);
    const jobId = createRes.body.data.id as string;

    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;

    const feedIds = await collectFeedJobIds(app, workerAccess);
    expect(feedIds).toContain(jobId);

    const notify = await prisma.notification.findFirst({
      where: {
        userId: workerUserId,
        type: 'job.favorites_only',
        dedupeKey: `job.favorites_only:${jobId}:${workerUserId}`,
      },
    });
    expect(notify).toBeTruthy();
  });
});
