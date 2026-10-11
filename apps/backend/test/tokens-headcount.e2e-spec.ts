import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token headcount adjust (e2e) CASE-TOKEN', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerUserId: string;
  let employerSessionId: string;
  let employerId: string;
  let branchId: string;
  let accessToken: string;

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
        data: { phoneE164: `+905569${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Headcount Token Test',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId, role: 'owner' },
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

    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });
    await prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: 30 },
      update: { balance: 30 },
    });

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'headcount-token',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;

    accessToken = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;
  }, 180_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  async function publishJob(headcount: number, key: string) {
    const startsAt = new Date(Date.now() + 90 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', key)
      .send({
        branchId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'Headcount test',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        headcount,
        payAmountMinor: 40_000,
        publish: true,
      });
    expect([200, 201]).toContain(res.status);
    return res.body.data.id as string;
  }

  it('T-158 increases hold when headcount rises', async () => {
    const jobId = await publishJob(2, `t158-${Date.now()}`);
    let hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.amount).toBe(2);

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t158-patch-${Date.now()}`)
      .send({ headcount: 5 });
    expect(patchRes.status).toBe(200);

    hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.amount).toBe(5);

    const balanceRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(balanceRes.body.data.held).toBeGreaterThanOrEqual(5);
  });

  it('T-159 releases excess hold when headcount decreases', async () => {
    const jobId = await publishJob(6, `t159-${Date.now()}`);
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t159-patch-${Date.now()}`)
      .send({ headcount: 3 });
    expect(patchRes.status).toBe(200);

    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.amount).toBe(3);

    const release = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: jobId, type: 'release' },
      orderBy: { createdAt: 'desc' },
    });
    expect(release?.amount).toBe(3);
  });

  it('T-158 rejects headcount increase when tokens insufficient', async () => {
    await prisma.tokenAccount.update({
      where: { employerId },
      data: { balance: 5 },
    });
    await prisma.tokenHold.updateMany({
      where: { employerId, status: 'held' },
      data: { status: 'released' },
    });

    const jobId = await publishJob(4, `t158-fail-${Date.now()}`);
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ headcount: 10 });
    expect(patchRes.status).toBe(422);
    expect(patchRes.body.error.code).toBe('TOKEN_INSUFFICIENT');
  });

  it('T-153 closing job with no applicants releases hold', async () => {
    await prisma.tokenAccount.update({
      where: { employerId },
      data: { balance: 20 },
    });
    await prisma.tokenHold.updateMany({
      where: { employerId, status: 'held' },
      data: { status: 'released' },
    });

    const jobId = await publishJob(3, `t153-${Date.now()}`);
    const before = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    const heldBefore = before.body.data.held as number;

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'closed' });
    expect(closeRes.status).toBe(200);

    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.status).toBe('released');

    const after = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(after.body.data.held).toBeLessThan(heldBefore);
  });
});
