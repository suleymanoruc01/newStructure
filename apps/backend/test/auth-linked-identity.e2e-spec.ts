import { createSign, generateKeyPairSync } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: 'jwk' }) as { kid?: string };
jwk.kid = 'test';

function sign(provider: 'apple' | 'google', sub: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid: 'test' }),
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      iss:
        provider === 'apple'
          ? 'https://appleid.apple.com'
          : 'https://accounts.google.com',
      aud: provider === 'apple' ? 'test-apple' : 'test-google',
      sub,
      exp: Math.floor(Date.now() / 1000) + 600,
    }),
  ).toString('base64url');
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${body}`)
    .sign(privateKey)
    .toString('base64url');
  return `${header}.${body}.${signature}`;
}

describe('Linked Apple/Google identity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;

  beforeAll(async () => {
    process.env.IDENTITY_TEST_JWK = JSON.stringify(jwk);
    process.env.APPLE_CLIENT_ID = 'test-apple';
    process.env.GOOGLE_CLIENT_ID = 'test-google';
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
    delete process.env.IDENTITY_TEST_JWK;
    delete process.env.APPLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    await app?.close();
  }, 30_000);

  async function accessFor(phone: string) {
    const user = await prisma.user.create({ data: { phoneE164: phone } });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: `link-${user.id}`,
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    return {
      user,
      access: tokens.signAccess(user.id, sessionId, { role: 'worker' })
        .accessToken,
    };
  }

  it('does not create a user until the identity is linked from a phone account', async () => {
    const subject = `apple-${Date.now()}`;
    const before = await prisma.user.count();
    const unknown = await request(app.getHttpServer())
      .post('/api/v1/auth/identities/login')
      .send({ provider: 'apple', idToken: sign('apple', subject) });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe('IDENTITY_NOT_LINKED');
    expect(await prisma.user.count()).toBe(before);

    const bad = await request(app.getHttpServer())
      .post('/api/v1/auth/identities/login')
      .send({ provider: 'google', idToken: sign('google', 'x') + 'tamper' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('IDENTITY_TOKEN_INVALID');
    expect(await prisma.user.count()).toBe(before);

    const phone = `+905560${Date.now().toString().slice(-7)}`;
    const { user, access } = await accessFor(phone);
    const linked = await request(app.getHttpServer())
      .post('/api/v1/auth/identities/link')
      .set('Authorization', `Bearer ${access}`)
      .send({ provider: 'apple', idToken: sign('apple', subject) });
    expect(linked.status).toBe(201);
    expect(linked.body.data.linked).toBe(true);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/identities/login')
      .send({ provider: 'apple', idToken: sign('apple', subject) });
    expect(login.status).toBe(201);
    expect(login.body.data.user.id).toBe(user.id);

    const other = await accessFor(`+905560${Date.now().toString().slice(-7)}`);
    const clash = await request(app.getHttpServer())
      .post('/api/v1/auth/identities/link')
      .set('Authorization', `Bearer ${other.access}`)
      .send({ provider: 'apple', idToken: sign('apple', subject) });
    expect(clash.status).toBe(409);
  });
});
