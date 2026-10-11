import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('False age report (e2e) T-191', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerAccess: string;
  let adminAccess: string;
  let workerUserId: string;
  let workerAccess: string;
  let branchId: string;
  let workerProfileId: string;

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
        data: { phoneE164: `+905571${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Yaş Şikayet AŞ',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId: employer.id, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 20 },
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
          tokenHash: 't191-employer',
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
      data: { phoneE164: `+905572${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    const workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 't191-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    workerAccess = tokens.signAccess(worker.id, workerSessionId, {
      role: 'worker',
    }).accessToken;
    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'Genç',
        lastName: 'İşçi',
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

    const admin = await prisma.user.create({
      data: { phoneE164: `+905573${Date.now().toString().slice(-7)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: admin.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: admin.id,
          tokenHash: 't191-admin',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(admin.id, adminSessionId, {
      role: 'admin',
    }).accessToken;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('keeps the stored birth date as the filter and queues a false-age report', async () => {
    const startsAt = new Date();
    startsAt.setUTCDate(startsAt.getUTCDate() + 4);
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

    const ageJob = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `t191-age-${Date.now()}`)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: '21 yaş şikayet',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        publish: true,
        minAge: 21,
      });
    expect([200, 201]).toContain(ageJob.status);
    const ageJobId = ageJob.body.data.id as string;

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${ageJobId}`)
      .set('Authorization', `Bearer ${workerAccess}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.eligibility.reasons).toContain('age_mismatch');

    const apply = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${ageJobId}/applications`)
      .set('Authorization', `Bearer ${workerAccess}`)
      .send({});
    expect(apply.status).toBe(422);
    expect(apply.body.error.code).toBe('JOB_NOT_APPLICABLE');

    const stored = await prisma.workerProfile.findUniqueOrThrow({
      where: { id: workerProfileId },
    });
    expect(stored.birthDate?.toISOString().slice(0, 10)).toBe('2010-01-01');

    const report = await request(app.getHttpServer())
      .post('/api/v1/moderation/reports')
      .set('Authorization', `Bearer ${employerAccess}`)
      .send({
        category: 'T-191',
        note: 'Doğum tarihi ilan yaş sınırını karşılamıyor.',
        targetUserId: workerUserId,
      });
    expect([200, 201]).toContain(report.status);
    expect(report.body.data.category).toBe('T-191');
    expect(report.body.data.status).toBe('open');

    const row = await prisma.abuseReport.findUnique({
      where: { id: report.body.data.id as string },
    });
    expect(row?.category).toBe('T-191');
    expect(row?.targetUserId).toBe(workerUserId);
    expect(row?.status).toBe('open');

    const queue = await request(app.getHttpServer())
      .get('/api/v1/admin/abuse-reports')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(queue.status).toBe(200);
    const ids = (queue.body.data.items as { id: string }[]).map((item) => item.id);
    expect(ids).toContain(report.body.data.id);
  });
});
