import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Token packages (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  let employerAccess: string;
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

    const user = await prisma.user.create({
      data: { phoneE164: `+905554${Date.now().toString().slice(-6)}` },
    });
    employerId = (
      await prisma.employer.create({
        data: {
          legalName: 'Paket AŞ',
          taxId: `${Date.now()}`.slice(-11).padStart(11, '1'),
          subscriptionPlanCode: 'professional',
        },
      })
    ).id;
    await prisma.employerMembership.create({
      data: { userId: user.id, employerId, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId, balance: 0 },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: 'employer-pkg',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'employer', employerId },
        },
      })
    ).id;
    employerAccess = tokens.signAccess(user.id, sessionId, {
      role: 'employer',
      employerId,
    }).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /employers/me/tokens/packages lists active packages', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens/packages')
      .set('Authorization', `Bearer ${employerAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('POST top-up with packageId credits tokens plus plan bonus', async () => {
    const packages = await request(app.getHttpServer())
      .get('/api/v1/employers/me/tokens/packages')
      .set('Authorization', `Bearer ${employerAccess}`);
    const pkg = packages.body.data.items[0];
    const res = await request(app.getHttpServer())
      .post('/api/v1/employers/me/tokens/top-ups')
      .set('Authorization', `Bearer ${employerAccess}`)
      .set('Idempotency-Key', `pkg-topup-${Date.now()}`)
      .send({ packageId: pkg.id, paymentOutcome: 'approve' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.credited).toBeGreaterThanOrEqual(pkg.tokenCount);
    expect(res.body.data.bonusCredited).toBeGreaterThanOrEqual(0);
  });
});
