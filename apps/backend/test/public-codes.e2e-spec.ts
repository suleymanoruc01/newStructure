import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Public identity codes ER/EE/TR/BR', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;

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
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('assigns EE, ER, TR, BR and completes workplace setup without a branch', async () => {
    const user = await prisma.user.create({
      data: { phoneE164: `+905557${Date.now().toString().slice(-7)}` },
    });
    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `pub-${user.id}`,
        expiresAt: new Date(Date.now() + 86400000),
        activeContext: { role: 'worker' },
      },
    });
    const workerToken = tokens.signAccess(user.id, session.id, {
      role: 'worker',
    }).accessToken;

    const worker = await request(app.getHttpServer())
      .get('/api/v1/workers/me')
      .set('Authorization', `Bearer ${workerToken}`);
    expect(worker.status).toBe(200);
    expect(worker.body.data.publicCode).toMatch(/^EE[A-Za-z0-9]{6}$/);

    const created = await request(app.getHttpServer())
      .post('/api/v1/employers')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        legalName: 'Kod Test İşyeri',
        taxId: `4${Date.now().toString().slice(-9)}`,
        industryCodes: ['hospitality'],
      });
    expect([200, 201]).toContain(created.status);
    expect(created.body.data.employer.publicCode).toMatch(/^TR[A-Za-z0-9]{6}$/);
    expect(created.body.data.user.employerPublicCode).toMatch(
      /^ER[A-Za-z0-9]{6}$/,
    );
    expect(created.body.data.user.workerPublicCode).toMatch(
      /^EE[A-Za-z0-9]{6}$/,
    );

    const employerToken = created.body.data.accessToken as string;
    const setup = await request(app.getHttpServer())
      .get('/api/v1/employers/me/setup-status')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(setup.status).toBe(200);
    expect(setup.body.data.complete).toBe(true);
    expect(setup.body.data.missing).not.toContain('branch');

    const branch = await request(app.getHttpServer())
      .post('/api/v1/branches')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        name: 'Kadıköy',
        addressLine1: 'Moda Cd. 1',
        city: 'İstanbul',
        latitude: 40.99,
        longitude: 29.02,
      });
    expect([200, 201]).toContain(branch.status);
    expect(branch.body.data.publicCode).toMatch(/^BR[A-Za-z0-9]{6}$/);
  });
});
