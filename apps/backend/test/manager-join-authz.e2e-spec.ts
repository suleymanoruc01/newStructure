import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import {
  generateManagerJoinCode,
  hashManagerJoinCode,
} from '../src/auth/auth.crypto.js';
import { TokenService } from '../src/auth/token.service.js';
import { AppConfigService } from '../src/config/app-config.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Manager join authz', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let pepper: string;
  let ownerId: string;
  let employerId: string;
  let ownerToken: string;
  let branchAId: string;
  let branchBId: string;
  let branchACode: string;
  let workplaceCode: string;

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
        data: { phoneE164: `+905571${stamp}` },
      })
    ).id;
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Authz Cafe',
        taxId: `6${stamp}1`.slice(0, 11),
        verificationStatus: 'bypass',
        subscriptionPlanCode: 'professional',
        addressLine1: 'İstiklal 2',
        city: 'İstanbul',
        latitude: 41.03,
        longitude: 28.98,
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: ownerId, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId, balance: 20 },
    });
    const ownerSession = await prisma.refreshSession.create({
      data: {
        userId: ownerId,
        tokenHash: `mgr-owner-${stamp}`,
        expiresAt: new Date(Date.now() + 86400000),
        activeContext: { role: 'employer', employerId },
      },
    });
    ownerToken = tokens.signAccess(ownerId, ownerSession.id, {
      role: 'employer',
      employerId,
    }).accessToken;

    workplaceCode = generateManagerJoinCode();
    await prisma.workplaceManagerInvite.create({
      data: {
        employerId,
        joinCode: workplaceCode,
        codeHash: hashManagerJoinCode(workplaceCode, pepper),
        expiresAt: new Date(Date.now() + 86400000),
        invitedByUserId: ownerId,
      },
    });

    const branchA = await request(app.getHttpServer())
      .post('/api/v1/branches')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Şube A',
        city: 'İstanbul',
        latitude: 41.04,
        longitude: 28.99,
      });
    const branchB = await request(app.getHttpServer())
      .post('/api/v1/branches')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Şube B',
        city: 'İstanbul',
        latitude: 41.05,
        longitude: 29.0,
      });
    expect([200, 201]).toContain(branchA.status);
    expect([200, 201]).toContain(branchB.status);
    branchAId = branchA.body.data.id as string;
    branchBId = branchB.body.data.id as string;
    branchACode = branchA.body.data.managerInviteCode as string;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  async function joinAs(code: string) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
    const userId = (
      await prisma.user.create({
        data: { phoneE164: `+90558${stamp}`.slice(0, 13) },
      })
    ).id;
    const session = await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: `join-${stamp}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/branches/manager-join')
      .set(
        'Authorization',
        `Bearer ${tokens.signAccess(userId, session.id, { role: 'worker' }).accessToken}`,
      )
      .send({ code });
    return { userId, sessionId: session.id, res };
  }

  it('rejects the workplace owner joining their own invite', async () => {
    const ownerSession = await prisma.refreshSession.findFirst({
      where: { userId: ownerId },
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/branches/manager-join')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ code: workplaceCode });
    expect(res.status).toBe(403);
    expect(ownerSession?.id).toBeTruthy();
  });

  it('does not burn useCount on a second join', async () => {
    const first = await joinAs(workplaceCode);
    expect([200, 201]).toContain(first.res.status);
    const before = await prisma.workplaceManagerInvite.findUnique({
      where: { employerId },
    });
    const second = await request(app.getHttpServer())
      .post('/api/v1/branches/manager-join')
      .set(
        'Authorization',
        `Bearer ${first.res.body.data.accessToken}`,
      )
      .send({ code: workplaceCode });
    expect([200, 201]).toContain(second.status);
    const after = await prisma.workplaceManagerInvite.findUnique({
      where: { employerId },
    });
    expect(after?.useCount).toBe(before?.useCount);
  });

  it('blocks a branch manager from patching another branch job', async () => {
    const joined = await joinAs(branchACode);
    expect([200, 201]).toContain(joined.res.status);
    const managerToken = joined.res.body.data.accessToken as string;

    const jobB = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `job-b-${Date.now()}`)
      .send({
        branchId: branchBId,
        sectorCode: 'hospitality',
        occupationCode: 'waiter',
        title: 'B şubesi',
        startsAt: new Date(Date.now() + 72 * 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 80 * 3_600_000).toISOString(),
        headcount: 1,
        payAmountMinor: 40_000,
        publish: true,
      });
    expect([200, 201]).toContain(jobB.status);
    const patched = await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobB.body.data.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ title: 'kaçış' });
    expect(patched.status).toBe(403);
  });

  it('revokes manager sessions', async () => {
    const joined = await joinAs(workplaceCode);
    expect([200, 201]).toContain(joined.res.status);
    const managerToken = joined.res.body.data.accessToken as string;
    const managerUserId = joined.userId;
    const revoked = await request(app.getHttpServer())
      .patch(`/api/v1/employers/me/managers/${managerUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'revoked' });
    expect(revoked.status).toBe(200);
    const listed = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(listed.status).toBe(403);
    const me = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(me.status).toBe(200);
  });

  it('rotate invalidates the previous workplace code', async () => {
    const rotated = await request(app.getHttpServer())
      .patch('/api/v1/employers/me/manager-invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ rotate: true });
    expect(rotated.status).toBe(200);
    expect(rotated.body.data.joinCode).not.toBe(workplaceCode);
    const stale = await joinAs(workplaceCode);
    expect(stale.res.status).toBe(400);
    const fresh = await joinAs(rotated.body.data.joinCode as string);
    expect([200, 201]).toContain(fresh.res.status);
  });
});
