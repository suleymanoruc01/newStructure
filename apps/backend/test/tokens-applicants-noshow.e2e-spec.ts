import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token applicants & no-show (e2e) CASE-TOKEN', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let workerUserId: string;
  let workerSessionId: string;
  let employerUserId: string;
  let employerSessionId: string;
  let employerId: string;
  let branchId: string;
  let branchLat = 41.01;
  let branchLng = 28.98;

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
      data: { phoneE164: `+905570${Date.now().toString().slice(-7)}` },
    });
    workerUserId = worker.id;
    workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'tok-worker',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: worker.id,
        firstName: 'No',
        lastName: 'Show',
        birthDate: new Date('1994-01-01'),
        gender: 'male',
        homeLatitude: branchLat,
        homeLongitude: branchLng,
        nightShiftAvailable: true,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile.id, occupationCode: 'waiter' },
    });

    employerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905571${Date.now().toString().slice(-7)}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'NoShow Token Co',
        taxId: `9${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: 50 },
      update: { balance: 50 },
    });
    const branch = await prisma.branch.create({
      data: {
        employerId,
        name: 'Merkez',
        latitude: branchLat,
        longitude: branchLng,
        city: 'İstanbul',
      },
    });
    branchId = branch.id;
    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'tok-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;
  }, 180_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function workerAccess() {
    return tokens.signAccess(workerUserId, workerSessionId, {
      role: 'worker',
    }).accessToken;
  }

  function employerAccess() {
    return tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;
  }

  let jobSequence = 0;

  async function publishJob(
    headcount: number,
    key: string,
    options: { startsInMinutes?: number } = {},
  ) {
    jobSequence += 1;
    const startsInMinutes = options.startsInMinutes ?? 15 + jobSequence * 5;
    const startsAt = new Date(Date.now() + startsInMinutes * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    const workerProfile = await prisma.workerProfile.findUniqueOrThrow({
      where: { userId: workerUserId },
    });
    const existingWindow = await prisma.availabilityWindow.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        dayOfWeek: startsAt.getUTCDay(),
      },
    });
    if (!existingWindow) {
      await prisma.availabilityWindow.create({
        data: {
          workerProfileId: workerProfile.id,
          dayOfWeek: startsAt.getUTCDay(),
          startMinute: 0,
          endMinute: 1439,
        },
      });
    }
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAccess()}`)
      .set('Idempotency-Key', key)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Token flow',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount,
        payAmountMinor: 40_000,
        publish: true,
      });
    expect([200, 201]).toContain(res.status);
    return {
      jobId: res.body.data.id as string,
      startsAt,
      endsAt,
    };
  }

  it('T-154 releases hold when job closes with pending applications only', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });
    const { jobId } = await publishJob(2, `t154-${Date.now()}`, {
      startsInMinutes: 60 * 72,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${workerAccess()}`)
      .set('Idempotency-Key', `t154-apply-${Date.now()}`)
      .send({})
      .expect(201);

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${employerAccess()}`)
      .send({ status: 'closed' });
    expect(closeRes.status).toBe(200);

    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.status).toBe('released');
  });

  it('T-155 releases one seat from hold when worker cannot come', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });
    const { jobId } = await publishJob(1, `t155-${Date.now()}`);
    const holdBefore = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(holdBefore?.amount).toBe(1);

    const applyRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${workerAccess()}`)
      .set('Idempotency-Key', `t155-apply-${Date.now()}`)
      .send({});
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.data.application.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${applicationId}/accept`)
      .set('Authorization', `Bearer ${employerAccess()}`)
      .set('Idempotency-Key', `t155-accept-${Date.now()}`)
      .expect(201);

    const shift = await prisma.shift.findFirst({
      where: { jobId, workerUserId },
    });
    expect(shift).toBeTruthy();

    const cannotRes = await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shift!.id}/availability-confirm`)
      .set('Authorization', `Bearer ${workerAccess()}`)
      .send({ decision: 'cannot_come', reason: 'Gelemiyorum' });
    expect(cannotRes.status).toBe(201);

    const capture = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: shift!.id, type: 'capture' },
    });
    expect(capture).toBeNull();

    const holdAfter = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(holdAfter?.status).toBe('released');
    const partialRelease = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: jobId, type: 'release' },
      orderBy: { createdAt: 'desc' },
    });
    expect(partialRelease?.amount).toBe(1);
  });

  it('T-157 partial capture: one check-in on multi-headcount job, close releases rest', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });

    const worker2 = await prisma.user.create({
      data: { phoneE164: `+905572${Date.now().toString().slice(-7)}` },
    });
    const worker2Session = (
      await prisma.refreshSession.create({
        data: {
          userId: worker2.id,
          tokenHash: 'tok-worker2',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    const profile2 = await prisma.workerProfile.create({
      data: {
        userId: worker2.id,
        firstName: 'Partial',
        lastName: 'Capture',
        birthDate: new Date('1993-01-01'),
        gender: 'male',
        homeLatitude: branchLat,
        homeLongitude: branchLng,
        nightShiftAvailable: true,
      },
    });
    await prisma.workerSector.create({
      data: { workerProfileId: profile2.id, sectorCode: 'hospitality' },
    });
    await prisma.workerOccupation.create({
      data: { workerProfileId: profile2.id, occupationCode: 'waiter' },
    });
    const worker2Access = () =>
      tokens.signAccess(worker2.id, worker2Session, { role: 'worker' })
        .accessToken;

    const { jobId, startsAt } = await publishJob(3, `t157-${Date.now()}`, {
      startsInMinutes: 12,
    });
    await prisma.availabilityWindow.create({
      data: {
        workerProfileId: profile2.id,
        dayOfWeek: startsAt.getUTCDay(),
        startMinute: 0,
        endMinute: 1439,
      },
    });

    const applyRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${worker2Access()}`)
      .set('Idempotency-Key', `t157-apply-${Date.now()}`)
      .send({});
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.data.application.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${applicationId}/accept`)
      .set('Authorization', `Bearer ${employerAccess()}`)
      .set('Idempotency-Key', `t157-accept-${Date.now()}`)
      .expect(201);

    const shift = await prisma.shift.findFirstOrThrow({
      where: { jobId, workerUserId: worker2.id },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shift.id}/availability-confirm`)
      .set('Authorization', `Bearer ${worker2Access()}`)
      .send({ decision: 'can_come' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/shifts/${shift.id}/check-in`)
      .set('Authorization', `Bearer ${worker2Access()}`)
      .set('Idempotency-Key', `t157-checkin-${shift.id}`)
      .send({
        latitude: branchLat,
        longitude: branchLng,
        accuracyM: 10,
        locationPermissionGranted: true,
        mockLocation: false,
      })
      .expect(201);

    const capture = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: shift.id, type: 'capture' },
    });
    expect(capture).toBeTruthy();

    const holdMid = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(holdMid?.amount).toBe(2);

    await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${employerAccess()}`)
      .send({ status: 'closed' })
      .expect(200);

    const holdFinal = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(holdFinal?.status).toBe('released');
    const releases = await prisma.tokenLedgerEntry.findMany({
      where: { refId: jobId, type: 'release' },
    });
    const releasedTotal = releases.reduce((sum, r) => sum + r.amount, 0);
    expect(releasedTotal).toBeGreaterThanOrEqual(2);
  });
});
