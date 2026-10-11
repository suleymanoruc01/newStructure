import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Matching favorites-only visibility (e2e) @T-075 @T-169', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let favoritesOnlyJobId: string;
  let publicJobId: string;

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
      data: { phoneE164: `+905559${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'fav-hidden-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Mehmet',
        lastName: 'Kaya',
        birthDate: new Date('1996-03-03'),
        gender: 'male',
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

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Fav Only AŞ',
        taxId: `6${Date.now().toString().slice(-9)}`,
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

    const startsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    const publicStartsAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    const publicEndsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
    for (const day of [
      startsAt.getUTCDay(),
      publicStartsAt.getUTCDay(),
    ]) {
      await prisma.availabilityWindow.create({
        data: {
          workerProfileId: profile.id,
          dayOfWeek: day,
          startMinute: 0,
          endMinute: 1439,
        },
      });
    }

    const favoritesOnlyJob = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Sadece favoriler',
        startsAt,
        endsAt,
        headcount: 1,
        remainingHeadcount: 1,
        favoritesOnly: true,
        publishedAt: new Date(),
      },
    });
    favoritesOnlyJobId = favoritesOnlyJob.id;

    const publicJob = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Herkese açık',
        startsAt: publicStartsAt,
        endsAt: publicEndsAt,
        headcount: 1,
        remainingHeadcount: 1,
        favoritesOnly: false,
        publishedAt: new Date(),
      },
    });
    publicJobId = publicJob.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('omits favorites-only jobs for workers not favorited by employer', async () => {
    const access = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;

    const feedRes = await request(app.getHttpServer())
      .get('/api/v1/jobs/feed')
      .set('Authorization', `Bearer ${access}`);
    expect(feedRes.status).toBe(200);
    const ids = (feedRes.body.data.items as { id: string }[]).map((j) => j.id);
    expect(ids).not.toContain(favoritesOnlyJobId);
    expect(ids).toContain(publicJobId);
  });
});
