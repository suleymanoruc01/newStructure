import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Jobs feed (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let sessionId: string;
  let jobId: string;

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

    const phone = `+905551${Date.now().toString().slice(-7)}`;
    const user = await prisma.user.create({
      data: { phoneE164: phone },
    });
    workerUserId = user.id;

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: 'test-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activeContext: { role: 'worker' },
      },
    });
    sessionId = session.id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        firstName: 'Test',
        lastName: 'Worker',
        birthDate: new Date('1995-01-01'),
        gender: 'female',
        homeLatitude: 41.0082,
        homeLongitude: 28.9784,
        nightShiftAvailable: false,
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
        legalName: 'Test Employer',
        taxId: `9${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 50 },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Merkez',
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });

    const startsAt = new Date(Date.now() + 45 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 8 * 60 * 60 * 1000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });
    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        startsAt,
        endsAt,
        headcount: 2,
        remainingHeadcount: 2,
        publishedAt: new Date(),
      },
    });
    jobId = job.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/jobs/feed returns eligible job for worker', async () => {
    const access = tokens.signAccess(workerUserId, sessionId, {
      role: 'worker',
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/jobs/feed?limit=10')
      .set('Authorization', `Bearer ${access.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.some((j: { id: string }) => j.id === jobId)).toBe(
      true,
    );
    expect(res.body.meta.pagination).toBeDefined();
  });

  it('GET /api/v1/job-catalog returns seeded items', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/job-catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });
});
