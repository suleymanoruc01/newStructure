import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { hashOtp } from '../src/auth/auth.crypto.js';
import { hashPassword } from '../src/auth/password.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Password registration and reset (e2e) T-008 T-248', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  async function openChallenge(phoneE164: string, purpose: string) {
    const user = await prisma.user.upsert({
      where: { phoneE164 },
      create: { phoneE164 },
      update: {},
    });
    const code = '654321';
    const challenge = await prisma.otpChallenge.create({
      data: {
        userId: user.id,
        phoneE164,
        codeHash: hashOtp(code, process.env.OTP_PEPPER ?? ''),
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    return { user, challengeId: challenge.id, code };
  }

  it('T-008 rejects a weak password after OTP sign-up', async () => {
    const phone = `+905590${Date.now().toString().slice(-7)}`;
    const opened = await openChallenge(phone, 'register');

    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId: opened.challengeId,
        code: opened.code,
      });
    expect([200, 201]).toContain(signup.status);
    const access = signup.body.data.accessToken as string;

    const weak = await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .set('Authorization', `Bearer ${access}`)
      .send({ password: '12345678' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('VALIDATION_FAILED');

    const strong = await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .set('Authorization', `Bearer ${access}`)
      .send({ password: 'PartOn12' });
    expect([200, 201]).toContain(strong.status);

    const again = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone, purpose: 'login' });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('PASSWORD_REQUIRED');

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone, password: 'PartOn12' });
    expect([200, 201]).toContain(login.status);
    expect(login.body.data.user.phone).toBe(phone);
  });

  it('T-248 allows two password-reset OTPs per Istanbul day', async () => {
    const phone = `+905591${Date.now().toString().slice(-7)}`;
    const passwordHash = await hashPassword('PartOn12');
    const user = await prisma.user.create({
      data: { phoneE164: phone, passwordHash },
    });
    await prisma.otpChallenge.createMany({
      data: [
        {
          userId: user.id,
          phoneE164: phone,
          codeHash: 'spent-1',
          purpose: 'password_reset',
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: new Date(),
        },
        {
          userId: user.id,
          phoneE164: phone,
          codeHash: 'spent-2',
          purpose: 'password_reset',
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: new Date(),
        },
      ],
    });

    const limited = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone, purpose: 'password_reset' });
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('PASSWORD_RESET_LIMIT');

    const freshPhone = `+905592${Date.now().toString().slice(-7)}`;
    const freshHash = await hashPassword('PartOn12');
    await prisma.user.create({
      data: { phoneE164: freshPhone, passwordHash: freshHash },
    });
    const reset = await openChallenge(freshPhone, 'password_reset');
    const changed = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId: reset.challengeId,
        code: reset.code,
      });
    expect([200, 201]).toContain(changed.status);
    const resetAccess = changed.body.data.accessToken as string;
    const saved = await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .set('Authorization', `Bearer ${resetAccess}`)
      .send({ password: 'YeniSifre12' });
    expect([200, 201]).toContain(saved.status);

    const oldLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: freshPhone, password: 'PartOn12' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: freshPhone, password: 'YeniSifre12' });
    expect([200, 201]).toContain(newLogin.status);
  });
});
