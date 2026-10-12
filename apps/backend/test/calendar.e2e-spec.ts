import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Worker and employer calendars (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let employerUserId: string;
  let workerSessionId: string;
  let employerSessionId: string;
  let employerId: string;
  let nearShiftId: string;
  let farShiftId: string;
  let nearStartsAt: Date;

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
      data: { phoneE164: `+905556${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'w-cal',
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
      },
    });
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile.id,
        dayOfWeek: 1,
        startMinute: 480,
        endMinute: 1020,
      },
    });

    employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905557${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Takvim Test AŞ',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id, role: 'owner' },
    });
    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'e-cal',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;
    const branch = await prisma.branch.create({
      data: {
        employerId: employer.id,
        name: 'Merkez',
        latitude: 41.01,
        longitude: 28.98,
        city: 'İstanbul',
      },
    });

    nearStartsAt = new Date(Date.now() + 60 * 60 * 1000);
    const nearEndsAt = new Date(nearStartsAt.getTime() + 4 * 60 * 60 * 1000);
    const farStartsAt = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);
    const farEndsAt = new Date(farStartsAt.getTime() + 4 * 60 * 60 * 1000);

    const nearJob = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        status: 'published',
        title: 'Yakın vardiya',
        startsAt: nearStartsAt,
        endsAt: nearEndsAt,
        headcount: 1,
        remainingHeadcount: 0,
        payCurrency: 'TRY',
        publishedAt: new Date(),
      },
    });
    const farJob = await prisma.job.create({
      data: {
        employerId: employer.id,
        branchId: branch.id,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        status: 'published',
        title: 'Uzak vardiya',
        startsAt: farStartsAt,
        endsAt: farEndsAt,
        headcount: 1,
        remainingHeadcount: 0,
        payCurrency: 'TRY',
        publishedAt: new Date(),
      },
    });
    const nearApp = await prisma.application.create({
      data: {
        jobId: nearJob.id,
        workerUserId: worker.id,
        workerProfileId: profile.id,
        status: 'accepted',
        profileSnapshot: { firstName: 'Ayşe', capturedAt: new Date().toISOString() },
      },
    });
    const farApp = await prisma.application.create({
      data: {
        jobId: farJob.id,
        workerUserId: worker.id,
        workerProfileId: profile.id,
        status: 'accepted',
        profileSnapshot: { firstName: 'Ayşe', capturedAt: new Date().toISOString() },
      },
    });
    nearShiftId = (
      await prisma.shift.create({
        data: {
          applicationId: nearApp.id,
          jobId: nearJob.id,
          workerUserId: worker.id,
          employerId: employer.id,
          branchId: branch.id,
          status: 'can_come',
          startsAt: nearStartsAt,
          endsAt: nearEndsAt,
          confirmOpensAt: new Date(Date.now() - 60 * 1000),
          confirmDeadlineAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })
    ).id;
    farShiftId = (
      await prisma.shift.create({
        data: {
          applicationId: farApp.id,
          jobId: farJob.id,
          workerUserId: worker.id,
          employerId: employer.id,
          branchId: branch.id,
          status: 'scheduled',
          startsAt: farStartsAt,
          endsAt: farEndsAt,
          confirmOpensAt: farStartsAt,
          confirmDeadlineAt: farEndsAt,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns worker shifts plus availability windows and employer roster with names', async () => {
    const workerAccess = tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;
    const employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;

    const workerCal = await request(app.getHttpServer())
      .get('/api/v1/workers/me/calendar')
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(workerCal.status).toBe(200);
    const workerIds = (workerCal.body.data.items as { id: string }[]).map(
      (row) => row.id,
    );
    expect(workerIds).toEqual(expect.arrayContaining([nearShiftId, farShiftId]));
    expect(workerCal.body.data.windows).toEqual([
      expect.objectContaining({
        dayOfWeek: 1,
        startMinute: 480,
        endMinute: 1020,
      }),
    ]);

    const ranged = await request(app.getHttpServer())
      .get('/api/v1/workers/me/calendar')
      .query({
        from: new Date(Date.now() - 60 * 1000).toISOString(),
        to: new Date(nearStartsAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(ranged.status).toBe(200);
    expect((ranged.body.data.items as { id: string }[]).map((row) => row.id)).toEqual([
      nearShiftId,
    ]);

    const bad = await request(app.getHttpServer())
      .get('/api/v1/workers/me/calendar')
      .query({ from: 'not-a-date' })
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_FAILED');

    const employerCal = await request(app.getHttpServer())
      .get('/api/v1/employers/me/calendar')
      .set('Authorization', `Bearer ${employerAccess}`);
    expect(employerCal.status).toBe(200);
    const employerItems = employerCal.body.data.items as {
      id: string;
      workerDisplayName: string | null;
    }[];
    expect(employerItems.map((row) => row.id)).toEqual(
      expect.arrayContaining([nearShiftId, farShiftId]),
    );
    expect(
      employerItems.find((row) => row.id === nearShiftId)?.workerDisplayName,
    ).toBe('Ayşe Yılmaz');

    const workerOnEmployer = await request(app.getHttpServer())
      .get('/api/v1/employers/me/calendar')
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(workerOnEmployer.status).toBe(403);

    const employerOnWorker = await request(app.getHttpServer())
      .get('/api/v1/workers/me/calendar')
      .set('Authorization', `Bearer ${employerAccess}`);
    expect(employerOnWorker.status).toBe(403);
  });
});
