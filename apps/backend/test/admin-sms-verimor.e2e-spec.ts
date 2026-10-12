import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { FALLBACK_OTP } from '../src/auth/sms.service.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Verimor SMS admin + fallback OTP', () => {
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
    app.useGlobalFilters(moduleRef.get(ApiExceptionFilter));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    tokens = moduleRef.get(TokenService);

    await prisma.smsSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', verimorEnabled: false },
      update: { verimorEnabled: false, username: '', password: '', header: '' },
    });

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905558${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-sms-verimor',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, adminSessionId, {
      role: 'admin',
    }).accessToken;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('GET sms settings hides password and reports fallback 290821', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/config/sms')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.verimorEnabled).toBe(false);
    expect(res.body.data.fallbackOtp).toBe('290821');
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordSet).toBe(false);
  });

  it('rejects enabling Verimor without credentials', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/sms')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        verimorEnabled: true,
        username: '',
        header: 'PARTON',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('stores credentials without echoing password', async () => {
    const saved = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/sms')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        verimorEnabled: false,
        username: '08505320000',
        header: 'PARTON',
        password: 'verimor-secret',
      });
    expect([200, 201]).toContain(saved.status);
    expect(saved.body.data.passwordSet).toBe(true);
    expect(saved.body.data.password).toBeUndefined();
    expect(saved.body.data.username).toBe('08505320000');

    const again = await request(app.getHttpServer())
      .get('/api/v1/admin/config/sms')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(again.body.data.passwordSet).toBe(true);
    expect(again.body.data.password).toBeUndefined();
  });

  it('verifies register OTP with 290821 while Verimor is off', async () => {
    const phone = `+905559${Date.now().toString().slice(-7)}`;
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone, purpose: 'register' });
    expect([200, 201]).toContain(requested.status);
    const challengeId = requested.body.data.challengeId as string;

    const wrong = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ challengeId, code: '000000' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('OTP_INVALID');

    const ok = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ challengeId, code: FALLBACK_OTP });
    expect([200, 201]).toContain(ok.status);
    expect(ok.body.data.accessToken).toBeTruthy();
  });
});
