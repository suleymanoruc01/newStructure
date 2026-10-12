import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Adapty payments admin + webhook', () => {
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

    await prisma.adaptySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {
        enabled: false,
        publicSdkKey: '',
        secretKey: '',
        webhookAuthorization: '',
        placementId: '',
        appleStoreConnected: false,
        googleStoreConnected: false,
      },
    });

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905561${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const adminSessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-adapty',
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
    await prisma?.adaptySettings.update({
      where: { id: 'default' },
      data: {
        enabled: false,
        publicSdkKey: '',
        secretKey: '',
        webhookAuthorization: '',
        placementId: '',
        appleStoreConnected: false,
        googleStoreConnected: false,
      },
    });
    await app?.close();
  }, 30_000);

  it('hides secrets on GET and rejects enable without keys', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/config/adapty')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(false);
    expect(res.body.data.secretKey).toBeUndefined();
    expect(res.body.data.webhookPath).toBe('/api/v1/webhooks/adapty');

    const denied = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/adapty')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        enabled: true,
        publicSdkKey: '',
        placementId: 'tokens',
        appleStoreConnected: true,
        googleStoreConnected: true,
      });
    expect(denied.status).toBe(400);
  });

  it('stores keys, exposes public SDK on remote-config, and credits via webhook', async () => {
    const saved = await request(app.getHttpServer())
      .patch('/api/v1/admin/config/adapty')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        enabled: true,
        publicSdkKey: 'public_live_test',
        placementId: 'tokens',
        appleStoreConnected: true,
        googleStoreConnected: true,
        secretKey: 'secret_live_test',
        webhookAuthorization: 'adapty-hook-secret',
      });
    expect([200, 201]).toContain(saved.status);
    expect(saved.body.data.secretSet).toBe(true);
    expect(saved.body.data.secretKey).toBeUndefined();

    const publicCfg = await request(app.getHttpServer()).get(
      '/api/v1/platform/remote-config',
    );
    expect(publicCfg.body.data.adaptyEnabled).toBe(true);
    expect(publicCfg.body.data.adaptyPublicSdkKey).toBe('public_live_test');
    expect(publicCfg.body.data.secretKey).toBeUndefined();

    const ping = await request(app.getHttpServer())
      .post('/api/v1/webhooks/adapty')
      .set('Authorization', 'adapty-hook-secret')
      .send({});
    expect([200, 201]).toContain(ping.status);

    const user = await prisma.user.create({
      data: { phoneE164: `+905562${Date.now().toString().slice(-7)}` },
    });
    const employer = await prisma.employer.create({
      data: {
        legalName: 'Adapty Test AŞ',
        taxId: `2${Date.now().toString().slice(-10)}`,
      },
    });
    await prisma.employerMembership.create({
      data: { userId: user.id, employerId: employer.id, role: 'owner' },
    });
    await prisma.tokenAccount.create({
      data: { employerId: employer.id, balance: 0 },
    });
    const pack = await prisma.tokenPackage.create({
      data: {
        label: 'Adapty 10',
        tokenCount: 10,
        priceTry: 199,
        iosProductId: 'parton_tokens_10',
        androidProductId: 'parton_tokens_10',
        adaptyProductId: 'parton_tokens_10',
      },
    });

    const credited = await request(app.getHttpServer())
      .post('/api/v1/webhooks/adapty')
      .set('Authorization', 'adapty-hook-secret')
      .send({
        customer_user_id: user.id,
        event_type: 'non_subscription_purchase',
        event_properties: {
          transaction_id: 'store-txn-1',
          vendor_product_id: pack.iosProductId,
        },
      });
    expect([200, 201]).toContain(credited.status);
    const account = await prisma.tokenAccount.findUnique({
      where: { employerId: employer.id },
    });
    expect(account?.balance).toBeGreaterThanOrEqual(10);

    await request(app.getHttpServer())
      .patch('/api/v1/admin/config/adapty')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        enabled: false,
        publicSdkKey: 'public_live_test',
        placementId: 'tokens',
        appleStoreConnected: true,
        googleStoreConnected: true,
      });
  });
});
