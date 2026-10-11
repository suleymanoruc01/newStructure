import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token hold lifecycle (e2e) CASE-TOKEN', () => {
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
        data: { phoneE164: `+905568${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Token Lifecycle Test',
        taxId: `7${Date.now().toString().slice(-9)}`,
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

    await prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: 20 },
      update: { balance: 20 },
    });

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'token-lifecycle',
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

  function jobBody(headcount: number) {
    const startsAt = new Date(Date.now() + 80 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    return {
      branchId,
      sectorCode: 'hospitality',
      occupationCode: 'waiter',
      title: 'Lifecycle ilan',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      headcount,
      payAmountMinor: 35_000,
      publish: true,
    };
  }

  it('T-151 hold amount equals headcount with ledger hold entry', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });

    const headcount = 4;
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t151-${Date.now()}`)
      .send(jobBody(headcount));
    expect([200, 201]).toContain(res.status);

    const jobId = res.body.data.id as string;
    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.amount).toBe(headcount);
    expect(hold?.status).toBe('held');

    const ledger = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: jobId, type: 'hold' },
    });
    expect(ledger).toBeTruthy();
    expect(ledger?.amount).toBe(-headcount);

    const balanceRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(balanceRes.body.data.held).toBeGreaterThanOrEqual(headcount);
  });

  it('T-152 closing a published job releases hold without capture', async () => {
    const headcount = 2;
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t152-create-${Date.now()}`)
      .send(jobBody(headcount));
    const jobId = createRes.body.data.id as string;

    const before = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    const heldBefore = before.body.data.held as number;

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t152-close-${Date.now()}`)
      .send({ status: 'closed' });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('closed');

    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.status).toBe('released');

    const capture = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: jobId, type: 'capture' },
    });
    expect(capture).toBeNull();

    const release = await prisma.tokenLedgerEntry.findFirst({
      where: { refId: jobId, type: 'release' },
    });
    expect(release).toBeTruthy();

    const after = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(after.body.data.held).toBeLessThan(heldBefore);
    expect(after.body.data.available).toBe(after.body.data.balance - after.body.data.held);
  });
});
