import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Favorites-only empty audience (e2e) CASE-JOB-POSTING T-057', () => {
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
        legalName: 'Fav Audience Gate AŞ',
        taxId: `8${Date.now().toString().slice(-9)}`,
        verificationStatus: 'bypass',
      },
    });
    employerId = employer.id;
    await prisma.employerMembership.create({
      data: { userId: employerUserId, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId, balance: 50 },
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
          tokenHash: 't057-employer',
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

  function jobBody(publish: boolean) {
    const startsAt = new Date(Date.now() + 72 * 3_600_000);
    const endsAt = new Date(startsAt.getTime() + 8 * 3_600_000);
    return {
      branchId,
      sectorCode: 'hospitality',
      occupationCode: 'waiter',
      title: 'Favorilere özel',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      headcount: 1,
      payAmountMinor: 40_000,
      publish,
      favoritesOnly: true,
    };
  }

  it('T-057 blocks publish when no eligible favorite workers exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t057-publish-${Date.now()}`)
      .send(jobBody(true));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('FAVORITES_AUDIENCE_EMPTY');

    const published = await prisma.job.count({
      where: { employerId, status: 'published', favoritesOnly: true },
    });
    expect(published).toBe(0);
  });

  it('T-057 saves draft and creates employer inbox job.audience_empty', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', `t057-draft-${Date.now()}`)
      .send(jobBody(false));
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.favoritesOnly).toBe(true);

    const jobId = res.body.data.id as string;
    const inbox = await prisma.notification.findFirst({
      where: {
        userId: employerUserId,
        type: 'job.audience_empty',
        dedupeKey: `job.audience_empty:${jobId}`,
      },
    });
    expect(inbox).toBeTruthy();
    expect(inbox?.title).toContain('Favori');
  });
});
