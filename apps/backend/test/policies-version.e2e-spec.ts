import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { PoliciesService } from '../src/policies/policies.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Policy read, versioned accept, and re-prompt (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let policies: PoliciesService;

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
    policies = moduleRef.get(PoliciesService);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('blocks accept until the current text is read and asks again after a new version', async () => {
    const phone = `+905594${Date.now().toString().slice(-7)}`;
    const user = await prisma.user.create({
      data: { phoneE164: phone, passwordHash: await hashPassword('PartOn12') },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone, password: 'PartOn12' });
    expect([200, 201]).toContain(login.status);
    const access = login.body.data.accessToken as string;

    const pending = await request(app.getHttpServer())
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${access}`);
    expect(pending.status).toBe(200);
    const items = pending.body.data.items as {
      id: string;
      slug: string;
      body: string;
      version: string;
    }[];
    expect(items.map((item) => item.slug)).toEqual(
      expect.arrayContaining(['kvkk', 'explicit-consent']),
    );
    const kvkk = items.find((item) => item.slug === 'kvkk');
    expect(kvkk?.body.length).toBeGreaterThan(20);

    const tooSoon = await request(app.getHttpServer())
      .post('/api/v1/policies/acceptances')
      .set('Authorization', `Bearer ${access}`)
      .send({ policyId: kvkk!.id, version: kvkk!.version });
    expect(tooSoon.status).toBe(409);
    expect(tooSoon.body.error.code).toBe('POLICY_READ_REQUIRED');

    const unread = await request(app.getHttpServer())
      .post('/api/v1/policies/reads')
      .set('Authorization', `Bearer ${access}`)
      .send({ policyId: kvkk!.id, version: kvkk!.version });
    expect(unread.status).toBe(400);

    const read = await request(app.getHttpServer())
      .post('/api/v1/policies/reads')
      .set('Authorization', `Bearer ${access}`)
      .send({ policyId: kvkk!.id, version: kvkk!.version, reachedEnd: true });
    expect([200, 201]).toContain(read.status);

    const accepted = await request(app.getHttpServer())
      .post('/api/v1/policies/acceptances')
      .set('Authorization', `Bearer ${access}`)
      .send({ policyId: kvkk!.id, version: kvkk!.version });
    expect([200, 201]).toContain(accepted.status);

    const after = await request(app.getHttpServer())
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${access}`);
    expect(
      (after.body.data.items as { id: string }[]).some((item) => item.id === kvkk!.id),
    ).toBe(false);

    const edited = await policies.updateDocument(
      user.id,
      kvkk!.id,
      { title: kvkk!.slug, body: `${kvkk!.body} Güncellendi.` },
      'test-request',
    );
    expect(edited.version).not.toBe(kvkk!.version);

    const again = await request(app.getHttpServer())
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${access}`);
    const revived = (again.body.data.items as { id: string; version: string }[]).find(
      (item) => item.id === kvkk!.id,
    );
    expect(revived?.version).toBe(edited.version);

    const log = await prisma.legalAuditEvent.findMany({
      where: { actorUserId: user.id, category: 'policy' },
    });
    expect(log.map((row) => row.action)).toEqual(
      expect.arrayContaining(['policy.read', 'policy.accept']),
    );

    await prisma.policyDocument.update({
      where: { id: kvkk!.id },
      data: {
        title: 'KVKK Aydınlatma Metni',
        body: kvkk!.body,
        version: kvkk!.version,
      },
    });
  });
});
