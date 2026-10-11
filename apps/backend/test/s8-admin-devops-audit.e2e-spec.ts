import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('S8 admin devops and audit (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
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

    prisma = moduleRef.get(PrismaService);
    tokens = moduleRef.get(TokenService);

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905559${Date.now().toString().slice(-7)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-s8',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, sessionId, {
      role: 'admin',
    }).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /admin/devops/services returns health aggregate', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/devops/services')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.services).toBeInstanceOf(Array);
    expect(typeof res.body.data.outboxPending).toBe('number');
  });

  it('GET /admin/audit/events lists legal audit rows', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/audit/events')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeInstanceOf(Array);
  });

  it('GET /admin/dashboard returns ops counters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.openDevopsErrors).toBeDefined();
  });
});
