import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Employers duplicate tax ID (e2e) @T-013', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: TokenService;
  const taxId = `8${Date.now().toString().slice(-9)}`;

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
  });

  afterAll(async () => {
    await app?.close();
  });

  async function bearerForNewUser() {
    const user = await prisma.user.create({
      data: { phoneE164: `+905558${Date.now().toString().slice(-7)}` },
    });
    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `hash-${user.id}`,
        expiresAt: new Date(Date.now() + 86400000),
        activeContext: { role: 'worker' },
      },
    });
    return tokens.signAccess(user.id, session.id, { role: 'worker' })
      .accessToken;
  }

  it('rejects duplicate tax ID with 409 CONFLICT', async () => {
    const firstToken = await bearerForNewUser();
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/employers')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        legalName: 'İlk Firma AŞ',
        taxId,
        industryCodes: ['hospitality'],
      });
    expect(createRes.status).toBe(201);

    const secondToken = await bearerForNewUser();
    const dupRes = await request(app.getHttpServer())
      .post('/api/v1/employers')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({
        legalName: 'İkinci Firma AŞ',
        taxId,
        industryCodes: ['hospitality'],
      });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('CONFLICT');
  });
});
