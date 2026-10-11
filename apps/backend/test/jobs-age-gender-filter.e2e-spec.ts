import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { collectFeedJobIds } from './feed-pages.js';

describe('Job age and gender filters (e2e) T-027 T-028 T-044', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerAccess: string;
  let workerUserId: string;
  let workerSessionId: string;
  let workerProfileId: string;
  let branchId: string;

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

    const employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905580${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Yaş Filtresi AŞ',
        taxId: `4${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id, role: 'owner' },
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
    branchId = branch.id;
    const employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 't027-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId: employer.id },
        },
      })
    ).id;
    employerAccess = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId: employer.id,
    }).accessToken;

    const worker = await prisma.user.create({
      data: { phoneE164: `+905581${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 't027-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Ece',
        lastName: 'Yaş',
        birthDate: new Date('2010-01-01'),
        gender: 'female',
        homeLatitude: 41.01,
        homeLongitude: 28.98,
        nightShiftAvailable: false,
      },
    });
    workerProfileId = profile.id;
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function workerBearer() {
    return tokens.signAccess(workerUserId, workerSessionId, { role: 'worker' })
      .accessToken;
  }

  it('hides an age-limited job until birth date meets minAge, and a gender filter until the profile matches', async () => {
    const startsAt = new Date();
    startsAt.setUTCDate(startsAt.getUTCDate() + 3);
    startsAt.setUTCHours(12, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 4 * 3_600_000);
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    const inverted = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Ters yaş',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        minAge: 30,
        maxAge: 18,
      });
    expect(inverted.status).toBe(400);
    expect(inverted.body.error.code).toBe('VALIDATION_FAILED');

    const ageJob = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `t027-age-${Date.now()}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: '21 yaş',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        publish: true,
        minAge: 21,
      });
    expect([200, 201]).toContain(ageJob.status);
    expect(ageJob.body.data.minAge).toBe(21);
    expect(ageJob.body.data.maxAge).toBeNull();
    const ageJobId = ageJob.body.data.id as string;

    const hidden = await collectFeedJobIds(app, workerBearer());
    expect(hidden).not.toContain(ageJobId);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${ageJobId}`)
      .set('Authorization', `Bearer ${workerBearer()}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.eligibility.eligible).toBe(false);
    expect(detail.body.data.eligibility.reasons).toContain('age_mismatch');

    const apply = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${ageJobId}/applications`)
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({});
    expect(apply.status).toBe(422);
    expect(apply.body.error.code).toBe('JOB_NOT_APPLICABLE');

    const older = await request(app.getHttpServer())
      .patch('/api/v1/workers/me')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({ birthDate: '1990-01-01' });
    expect(older.status).toBe(200);
    expect(older.body.data.birthDate).toBe('1990-01-01');

    const visible = await collectFeedJobIds(app, workerBearer());
    expect(visible).toContain(ageJobId);

    const genderJob = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `t044-gender-${Date.now()}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Erkek ilan',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        publish: true,
        genderFilter: 'male',
      });
    expect([200, 201]).toContain(genderJob.status);
    expect(genderJob.body.data.genderFilter).toBe('male');
    const genderJobId = genderJob.body.data.id as string;
    const stored = await prisma.job.findUnique({ where: { id: genderJobId } });
    expect(stored?.genderFilter).toBe('male');

    const beforeGender = await collectFeedJobIds(app, workerBearer());
    expect(beforeGender).not.toContain(genderJobId);

    const male = await request(app.getHttpServer())
      .patch('/api/v1/workers/me')
      .set('Authorization', `Bearer ${workerBearer()}`)
      .send({ gender: 'male' });
    expect(male.status).toBe(200);

    const afterGender = await collectFeedJobIds(app, workerBearer());
    expect(afterGender).toContain(genderJobId);
  });
});
