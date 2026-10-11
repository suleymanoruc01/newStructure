import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token top-up failed payment (e2e) @T-161', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerUserId: string;
  let employerSessionId: string;
  let employerId: string;
  let branchId: string;
  let accessToken: string;
  let draftJobId: string;

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
        data: { phoneE164: `+905563${Date.now().toString().slice(-7)}` },
      })
    ).id;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'T161 Test AŞ',
        taxId: `5${Date.now().toString().slice(-9)}`,
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
      create: { employerId, balance: 0 },
      update: { balance: 0 },
    });

    employerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: employerUserId,
          tokenHash: 't161-employer',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;

    accessToken = tokens.signAccess(employerUserId, employerSessionId, {
      role: 'employer',
      employerId,
    }).accessToken;

    const startsAt = new Date(Date.now() + 86_400_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    const job = await prisma.job.create({
      data: {
        employerId,
        branchId,
        status: 'draft',
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'T161 draft',
        startsAt,
        endsAt,
        headcount: 2,
        remainingHeadcount: 2,
        payAmountMinor: 50_000,
        payCurrency: 'TRY',
      },
    });
    draftJobId = job.id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('declined sandbox top-up does not credit ledger or publish draft', async () => {
    const topUpRes = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t161-decline-${Date.now()}`)
      .send({ amount: 10, paymentOutcome: 'decline' });
    expect(topUpRes.status).toBe(422);
    expect(topUpRes.body.error.code).toBe('PAYMENT_DECLINED');

    const balanceRes = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(balanceRes.body.data.balance).toBe(0);
    expect(balanceRes.body.data.held).toBe(0);

    const publishRes = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${draftJobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'published' });
    expect(publishRes.status).toBe(422);
    expect(publishRes.body.error.code).toBe('TOKEN_INSUFFICIENT');

    const job = await prisma.job.findUnique({ where: { id: draftJobId } });
    expect(job?.status).toBe('draft');

    const hold = await prisma.tokenHold.findUnique({
      where: { jobId: draftJobId },
    });
    expect(hold).toBeNull();
  });
});
