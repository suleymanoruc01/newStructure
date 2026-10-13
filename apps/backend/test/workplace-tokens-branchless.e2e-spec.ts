import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  generateManagerJoinCode,
  hashManagerJoinCode,
} from '../src/auth/auth.crypto.js';
import { AppConfigService } from '../src/config/app-config.service.js';

describe('Branchless workplace jobs and token pools', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let pepper: string;
  let ownerId: string;
  let employerId: string;
  let ownerToken: string;
  let managerToken: string;
  let managerUserId: string;

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
    pepper = moduleRef.get(AppConfigService).env.OTP_PEPPER;

    const stamp = Date.now().toString().slice(-8);
    ownerId = (
      await prisma.user.create({
        data: { phoneE164: `+905561${stamp}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Branchless Cafe',
        taxId: `7${stamp}1`.slice(0, 11),
        verificationStatus: 'bypass',
        addressLine1: 'İstiklal Cad. 1',
        city: 'İstanbul',
        latitude: 41.035,
        longitude: 28.985,
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: ownerId, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId, balance: 2 },
    });
    const ownerSession = await prisma.refreshSession.create({
      data: {
        userId: ownerId,
        tokenHash: `wp-owner-${stamp}`,
        expiresAt: new Date(Date.now() + 86400000),
        activeContext: { role: 'employer', employerId },
      },
    });
    ownerToken = tokens.signAccess(ownerId, ownerSession.id, {
      role: 'employer',
      employerId,
    }).accessToken;

    managerUserId = (
      await prisma.user.create({
        data: { phoneE164: `+905562${stamp}` },
      })
    ).id;
    const joinCode = generateManagerJoinCode();
    await prisma.workplaceManagerInvite.create({
      data: {
        employerId,
        joinCode,
        codeHash: hashManagerJoinCode(joinCode, pepper),
        expiresAt: new Date(Date.now() + 86400000),
        invitedByUserId: ownerId,
      },
    });
    const managerSession = await prisma.refreshSession.create({
      data: {
        userId: managerUserId,
        tokenHash: `wp-mgr-${stamp}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const join = await request(app.getHttpServer())
      .post('/api/v1/branches/manager-join')
      .set(
        'Authorization',
        `Bearer ${tokens.signAccess(managerUserId, managerSession.id, { role: 'worker' }).accessToken}`,
      )
      .send({ code: joinCode });
    expect([200, 201]).toContain(join.status);
    managerToken = join.body.data.accessToken;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  function jobBody(headcount: number) {
    const startsAt = new Date(Date.now() + 72 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    return {
      sectorCode: 'hospitality',
      occupationCode: 'waiter',
      title: 'Şubesiz ilan',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      headcount,
      payAmountMinor: 40_000,
      publish: true,
    };
  }

  it('publishes a job with no branch using workplace coords', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `wp-job-${Date.now()}`)
      .send(jobBody(1));
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.branchId).toBeNull();
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.branchLatitude).toBeCloseTo(41.035, 3);
  });

  it('top-up credits the owner purse and allocate moves to the workplace', async () => {
    const topUp = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `wp-topup-${Date.now()}`)
      .send({ amount: 5, paymentOutcome: 'approve' });
    expect(topUp.status).toBe(201);
    expect(topUp.body.data.balance).toBeGreaterThanOrEqual(5);

    const allocated = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/allocate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 3, target: 'workplace' });
    expect(allocated.status).toBe(201);
    expect(allocated.body.data.workplace).toBeGreaterThanOrEqual(3);

    const balance = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(balance.body.data.unallocated).toBeGreaterThanOrEqual(2);
  });

  it('manager requests tokens without amount and owner approves with amount', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ note: 'haftalık ilan' });
    expect(created.status).toBe(201);
    expect(created.body.data.amount).toBeNull();
    const requestId = created.body.data.id as string;

    const listed = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens/requests')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(listed.body.data.items.some((row: { id: string }) => row.id === requestId)).toBe(
      true,
    );

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/employers/me/tokens/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 1 });
    expect(approved.status).toBe(201);
    expect(approved.body.data.status).toBe('approved');
    expect(approved.body.data.resolvedAmount).toBe(1);
  });

  it('workplace manager publishes a branchless job from the workplace pool', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('Idempotency-Key', `wp-mgr-job-${Date.now()}`)
      .send(jobBody(1));
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.branchId).toBeNull();
    expect(res.body.data.status).toBe('published');
  });

  it('authorized manager can CRU jobs and branches but cannot close or refund', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('Idempotency-Key', `wp-mgr-hc-${Date.now()}`)
      .send(jobBody(2));
    expect([200, 201]).toContain(created.status);
    const jobId = created.body.data.id as string;

    const closed = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'closed' });
    expect(closed.status).toBe(403);

    const reduced = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ headcount: 1 });
    expect(reduced.status).toBe(200);
    expect(reduced.body.data.headcount).toBe(1);
    const hold = await prisma.tokenHold.findUnique({ where: { jobId } });
    expect(hold?.amount).toBe(2);

    const branch = await request(app.getHttpServer())
      .post('/api/v1/branches')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Yetkili şube',
        city: 'İstanbul',
        latitude: 41.04,
        longitude: 28.99,
      });
    expect([200, 201]).toContain(branch.status);

    const topUp = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('Idempotency-Key', `wp-mgr-buy-${Date.now()}`)
      .send({ amount: 2, paymentOutcome: 'approve' });
    expect(topUp.status).toBe(201);
  });

  it('owner can create a second workplace', async () => {
    const stamp = Date.now().toString().slice(-8);
    const res = await request(app.getHttpServer())
      .post('/api/v1/employers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        legalName: 'Ikinci Isyeri',
        taxId: `8${stamp}2`.slice(0, 11),
        addressLine1: 'Bagdat Cad. 10',
        city: 'İstanbul',
        latitude: 40.96,
        longitude: 29.07,
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.employer.id).toBeTruthy();
    const listed = await request(app.getHttpServer())
      .get('/api/v1/employers')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data.items.length).toBeGreaterThanOrEqual(2);
  });
});
