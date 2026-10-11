import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('S9 platform and realtime (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let access: string;

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

    const user = await prisma.user.create({
      data: { phoneE164: `+905551${Date.now().toString().slice(-7)}` },
    });
    await prisma.workerProfile.create({
      data: {
        userId: user.id,
        firstName: 'Test',
        lastName: 'Worker',
        birthDate: new Date('1995-01-01'),
        gender: 'unspecified',
        homeLatitude: 41.01,
        homeLongitude: 28.97,
      },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: 's9-rt',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    access = tokens.signAccess(user.id, sessionId, {
      role: 'worker',
    }).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /platform/remote-config is public', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/platform/remote-config',
    );
    expect(res.status).toBe(200);
    expect(res.body.data.maintenanceMode).toBeDefined();
  });

  it('POST /realtime/ticket returns SSE ticket', async () => {
    const ticketRes = await request(app.getHttpServer())
      .post('/api/v1/realtime/ticket')
      .set('Authorization', `Bearer ${access}`);
    expect([200, 201]).toContain(ticketRes.status);
    expect(ticketRes.body.data.ticket).toMatch(/^[a-f0-9]+$/);
  });

  it('GET /realtime/stream without ticket is forbidden', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/realtime/stream',
    );
    expect(res.status).toBe(403);
  });
});
