import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token live balance (e2e) CASE-TOKEN T-163', () => {
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
        data: { phoneE164: `+905567${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Token Live Balance Test',
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

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 'token-live-balance',
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

  async function assertBalanceMatchesLedger() {
    const balanceRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(balanceRes.status).toBe(200);

    const account = await prisma.tokenAccount.findUnique({
      where: { employerId },
    });
    expect(balanceRes.body.data.balance).toBe(account?.balance ?? 0);

    const latestLedger = await prisma.tokenLedgerEntry.findFirst({
      where: { employerId },
      orderBy: { createdAt: 'desc' },
    });
    if (latestLedger) {
      expect(balanceRes.body.data.balance).toBe(latestLedger.balanceAfter);
    }

    const heldAgg = await prisma.tokenHold.aggregate({
      where: { employerId, status: 'held' },
      _sum: { amount: true },
    });
    const heldSum = heldAgg._sum.amount ?? 0;
    expect(balanceRes.body.data.held).toBe(heldSum);
    expect(balanceRes.body.data.available).toBe(
      balanceRes.body.data.balance - heldSum,
    );

    const ledgerRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens/ledger')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ledgerRes.status).toBe(200);
    const newest = ledgerRes.body.data.items[0] as
      | { balanceAfter: number }
      | undefined;
    if (newest) {
      expect(balanceRes.body.data.balance).toBe(newest.balanceAfter);
    }
  }

  function jobBody(headcount: number, publish: boolean) {
    const startsAt = new Date(Date.now() + 72 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    return {
      branchId,
      sectorCode: 'hospitality',
      occupationCode: 'waiter',
      title: 'T-163 balance sync',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      headcount,
      payAmountMinor: 40_000,
      publish,
    };
  }

  it('T-163 GET tokens stays consistent with ledger after each mutation', async () => {
    await prisma.tokenHold.updateMany({
      where: { employerId },
      data: { status: 'released' },
    });
    await prisma.tokenAccount.upsert({
      where: { employerId },
      create: { employerId, balance: 0 },
      update: { balance: 0 },
    });
    await assertBalanceMatchesLedger();

    const topUp = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t163-topup-${Date.now()}`)
      .send({ amount: 12, paymentOutcome: 'approve' });
    expect(topUp.status).toBe(201);
    expect(topUp.body.data.balance).toBe(12);
    await assertBalanceMatchesLedger();

    const publish = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t163-job-${Date.now()}`)
      .send(jobBody(4, true));
    expect([200, 201]).toContain(publish.status);
    await assertBalanceMatchesLedger();

    const afterPublish = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(afterPublish.body.data.held).toBe(4);
    expect(afterPublish.body.data.available).toBe(8);
  });
});
