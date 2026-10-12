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

describe('Matching favorites-only visibility (e2e) @T-075 @T-169', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let outsiderUserId: string;
  let outsiderSessionId: string;
  let insiderUserId: string;
  let insiderSessionId: string;
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

    const employerUser = await prisma.user.create({
      data: { phoneE164: `+905558${Date.now().toString().slice(-7)}` },
    });
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Fav Only AŞ',
        taxId: `6${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    await prisma.employerMembership.create({
      data: {
        userId: employerUser.id,
        employerId: employer.id,
        role: 'owner',
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

    const seedWorker = async (label: string) => {
      const worker = await prisma.user.create({
        data: {
          phoneE164: `+905559${Date.now().toString().slice(-7)}${label === 'out' ? '0' : '1'}`,
        },
      });
      const session = await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: `fav-hidden-${label}`,
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      });
      const profile = await prisma.workerProfile.create({
        data: {
          userId: worker.id,
          firstName: label,
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
      return { worker, session, profile };
    };

    const outsider = await seedWorker('out');
    outsiderUserId = outsider.worker.id;
    outsiderSessionId = outsider.session.id;
    const insider = await seedWorker('in');
    insiderUserId = insider.worker.id;
    insiderSessionId = insider.session.id;

    await prisma.favorite.create({
      data: {
        ownerUserId: employerUser.id,
        ownerEmployerId: employer.id,
        targetKind: 'worker_user',
        targetId: insiderUserId,
      },
    });

    const startsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    const publicStartsAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    const publicEndsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
    const days = [...new Set([startsAt.getUTCDay(), publicStartsAt.getUTCDay()])];
    for (const day of days) {
      await prisma.availabilityWindow.create({
        data: {
          workerProfileId: outsider.profile.id,
          dayOfWeek: day,
          startMinute: 0,
          endMinute: 1439,
        },
      });
      await prisma.availabilityWindow.create({
        data: {
          workerProfileId: insider.profile.id,
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
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('omits favorites-only jobs for workers not favorited by employer', async () => {
    const access = tokens.signAccess(outsiderUserId, outsiderSessionId, {
      role: 'worker',
    }).accessToken;

    const ids = await collectFeedJobIds(app, access);
    expect(ids).not.toContain(favoritesOnlyJobId);
    expect(ids).toContain(publicJobId);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${favoritesOnlyJobId}`)
      .set('Authorization', `Bearer ${access}`);
    expect(detail.status).toBe(404);
    expect(detail.body.error.code).toBe('NOT_FOUND');

    const apply = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${favoritesOnlyJobId}/applications`)
      .set('Authorization', `Bearer ${access}`)
      .send({});
    expect(apply.status).toBe(404);
    expect(apply.body.error.code).toBe('NOT_FOUND');
  });

  it('shows favorites-only jobs to the employer favorites audience', async () => {
    const access = tokens.signAccess(insiderUserId, insiderSessionId, {
      role: 'worker',
    }).accessToken;

    const ids = await collectFeedJobIds(app, access);
    expect(ids).toContain(favoritesOnlyJobId);
    expect(ids).toContain(publicJobId);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${favoritesOnlyJobId}`)
      .set('Authorization', `Bearer ${access}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.favoritesOnly).toBe(true);
    expect(detail.body.data.eligibility.eligible).toBe(true);
  });
});
