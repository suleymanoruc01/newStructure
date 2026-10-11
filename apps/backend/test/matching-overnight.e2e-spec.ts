import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Matching overnight availability (e2e) @T-073', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let overnightJobId: string;

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
      data: { phoneE164: `+905560${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'overnight-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Zeynep',
        lastName: 'Ak',
        birthDate: new Date('1998-07-07'),
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

    const base = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    base.setUTCHours(23, 0, 0, 0);
    const startsAt = new Date(base);
    const endsAt = new Date(startsAt.getTime() + 6 * 60 * 60 * 1000);
    const startDay = startsAt.getUTCDay();

    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: startDay,
        startMinute: 22 * 60,
        endMinute: 6 * 60,
        crossesMidnight: true,
      },
    });

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Gece Vardiya AŞ',
        taxId: `5${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Gece',
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Gece vardiya',
        startsAt,
        endsAt,
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    overnightJobId = job.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('includes cross-midnight job when overnight availability covers interval', async () => {
    const access = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;

    const feedRes = await request(app.getHttpServer())
      .get('/api/v1/jobs/feed')
      .set('Authorization', `Bearer ${access}`);
    expect(feedRes.status).toBe(200);
    const ids = (feedRes.body.data.items as { id: string }[]).map((j) => j.id);
    expect(ids).toContain(overnightJobId);
  });
});
