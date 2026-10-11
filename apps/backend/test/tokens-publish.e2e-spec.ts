import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TokensService } from '../src/tokens/tokens.service.js';

describe('Token publish & ledger (e2e) CASE-TOKEN', () => {
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
        data: { phoneE164: `+905565${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Token Publish Test',
        taxId: `6${Date.now().toString().slice(-9)}`,
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

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'token-publish',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;

    accessToken = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function jobBody(headcount: number, publish: boolean) {
    const startsAt = new Date(Date.now() + 72 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    return {
      branchId,
      sectorCode: 'hospitality',
      occupationCode: 'waiter',
      title: 'Token test ilan',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      headcount,
      payAmountMinor: 40_000,
      publish,
    };
  }

  it('T-149 publishes when available balance covers headcount', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });
    await prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: 10 },
      update: { balance: 10 },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t149-${Date.now()}`)
      .send(jobBody(3, true));
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.status).toBe('published');

    const hold = await prisma.tokenHold.findUnique({
      where: { jobId: res.body.data.id },
    });
    expect(hold?.status).toBe('held');
    expect(hold?.amount).toBe(3);

    const balanceRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(balanceRes.body.data.held).toBeGreaterThanOrEqual(3);
    expect(balanceRes.body.data.available).toBe(10 - balanceRes.body.data.held);
  });

  it('T-150 rejects publish when tokens insufficient', async () => {
    await prisma.tokenAccount.update({
      where: { employerId },
      data: { balance: 1 },
    });
    await prisma.tokenHold.updateMany({
      where: { employerId, status: 'held' },
      data: { status: 'released' },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t150-${Date.now()}`)
      .send(jobBody(5, true));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('TOKEN_INSUFFICIENT');
  });

  it('T-160 idempotent top-up and hold key reuse rules', async () => {
    await prisma.tokenAccount.update({
      where: { employerId },
      data: { balance: 0 },
    });

    const key = `t160-topup-${Date.now()}`;
    const first = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 8, paymentOutcome: 'approve' });
    expect(first.status).toBe(201);
    const second = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 8, paymentOutcome: 'approve' });
    expect([200, 201]).toContain(second.status);
    expect(second.body.data.credited).toBe(8);

    const ledgerCount = await prisma.tokenLedgerEntry.count({
      where: { idempotencyKey: key },
    });
    expect(ledgerCount).toBe(1);

    const mismatch = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 9, paymentOutcome: 'approve' });
    expect(mismatch.status).toBe(409);
    expect(mismatch.body.error.code).toBe('CONFLICT');

    const tokensService = app.get(TokensService);
    const holdKey = `t160-hold-${Date.now()}`;
    const startsAt = new Date(Date.now() + 96 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    const jobA = await prisma.job.create({
      data: {
        employerId,
        branchId,
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
    const jobB = await prisma.job.create({
      data: {
        employerId,
        branchId,
        status: 'published',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'B',
        startsAt,
        endsAt,
        headcount: 1,
        remainingHeadcount: 1,
        publishedAt: new Date(),
      },
    });
    await tokensService.holdForJob(employerId, jobA.id, 2, holdKey);
    await expect(
      tokensService.holdForJob(employerId, jobB.id, 1, holdKey),
    ).rejects.toMatchObject({ code: 'HOLD_EXISTS' });
  });

  it('T-162 lists ledger movements', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens/ledger')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const types = res.body.data.items.map((r: { type: string }) => r.type);
    expect(types.some((t: string) => t === 'top_up' || t === 'hold')).toBe(
      true,
    );
  });
});
