import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin dashboard analytics (e2e)', () => {
  let app: INestApplication;
  let adminAccess: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    await app.init();

    const prisma = moduleRef.get(PrismaService);
    const tokens = moduleRef.get(TokenService);
    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905553${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-dash-analytics',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, adminSessionId, {
      role: 'admin',
    }).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /admin/dashboard includes business and trends', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.business).toMatchObject({
      totalUsers: expect.any(Number),
      totalEmployers: expect.any(Number),
      publishedJobs: expect.any(Number),
      estimatedRevenueTryMonth: expect.any(Number),
    });
    expect(res.body.data.trends.dayKeys).toHaveLength(7);
    expect(res.body.data.trends.newUsersByDay).toHaveLength(7);
    expect(res.body.data.trends.applicationsByDay).toHaveLength(7);
    expect(res.body.data.trends.topUpTokensByDay).toHaveLength(7);
  });
});
