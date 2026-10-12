import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin subscriptions and support (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let adminAccess: string;
  let workerAccess: string;
  let employerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    tokens = moduleRef.get(TokenService);

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905551${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-sub-support',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, adminSessionId, {
      role: 'admin',
    }).accessToken;

    const worker = await prisma.user.create({
      data: { phoneE164: `+905552${Date.now().toString().slice(-6)}` },
    });
    const workerSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: worker.id,
          tokenHash: 'worker-sub-support',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    workerAccess = tokens.signAccess(worker.id, workerSessionId, {
      role: 'worker',
    }).accessToken;

    const employer = await prisma.employer.create({
      data: {
        legalName: 'Test AŞ',
        taxId: `${Date.now()}`.slice(-11).padStart(11, '0'),
        subscriptionPlanCode: 'free',
      },
    });
    employerId = employer.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /admin/subscriptions/plans returns seeded plans', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/subscriptions/plans')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(4);
  });

  it('POST /support/tickets creates a ticket for worker', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${workerAccess}`)
      .send({
        subject: 'Ödeme sorunu',
        body: 'Jeton yüklemesi görünmüyor, yardım istiyorum.',
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('open');
  });

  it('PATCH /admin/employers/:id/subscription changes plan', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/employers/${employerId}/subscription`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ planCode: 'starter', status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.data.subscriptionPlanCode).toBe('starter');
  });

  it('GET /admin/dashboard includes openSupportTickets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.openSupportTickets).toBe('number');
  });
});
