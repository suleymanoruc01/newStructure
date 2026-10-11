import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { hashOtp } from '../src/auth/auth.crypto.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Auth ban and device fingerprint (e2e) T-184 T-192', () => {
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

  async function challengeFor(phoneE164: string) {
    const user = await prisma.user.create({ data: { phoneE164 } });
    const code = '123456';
    const challenge = await prisma.otpChallenge.create({
      data: {
        userId: user.id,
        phoneE164,
        codeHash: hashOtp(code, process.env.OTP_PEPPER ?? ''),
        purpose: 'login',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    return { user, challengeId: challenge.id, code };
  }

  it('T-192 rejects OTP verify when the phone is on auth_bans', async () => {
    const phone = `+905571${Date.now().toString().slice(-7)}`;
    const { challengeId, code } = await challengeFor(phone);
    await prisma.authBan.create({
      data: { phoneE164: phone, reason: 'test-ban' },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ challengeId, code });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_BANNED');
  });

  it('T-184 records a shared device hash and writes a risk event', async () => {
    const deviceId = `device-${Date.now()}`;
    const first = await challengeFor(
      `+905572${Date.now().toString().slice(-7)}`,
    );
    const firstRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId: first.challengeId,
        code: first.code,
        deviceId,
      });
    expect([200, 201]).toContain(firstRes.status);

    const second = await challengeFor(
      `+905573${Date.now().toString().slice(-7)}`,
    );
    const secondRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId: second.challengeId,
        code: second.code,
        deviceId,
      });
    expect([200, 201]).toContain(secondRes.status);

    const risk = await prisma.riskEvent.findFirst({
      where: { userId: second.user.id, type: 'multi_account_device' },
    });
    expect(risk).toBeTruthy();
    const stored = await prisma.deviceFingerprint.count({
      where: { userId: { in: [first.user.id, second.user.id] } },
    });
    expect(stored).toBe(2);
  });
});
