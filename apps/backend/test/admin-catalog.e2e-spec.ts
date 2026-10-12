import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin job catalog (e2e)', () => {
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
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    tokens = moduleRef.get(TokenService);

    const adminUser = await prisma.user.create({
      data: { phoneE164: `+905553${Date.now().toString().slice(-6)}` },
    });
    await prisma.platformAdmin.create({
      data: { userId: adminUser.id, role: 'ops' },
    });
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId: adminUser.id,
          tokenHash: 'admin-catalog',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'admin' },
        },
      })
    ).id;
    adminAccess = tokens.signAccess(adminUser.id, sessionId, {
      role: 'admin',
    }).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('structured sector and occupation CRUD', async () => {
    const sectorCode = `sec_${Date.now()}`;
    const createSector = await request(app.getHttpServer())
      .post('/api/v1/admin/catalog/sectors')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        code: sectorCode,
        displayName: 'Test sektör',
        icon: '🧪',
        sortOrder: 99,
      });
    expect([200, 201]).toContain(createSector.status);
    const sectorId = createSector.body.data.id as string;

    const createOcc = await request(app.getHttpServer())
      .post(`/api/v1/admin/catalog/sectors/${sectorId}/occupations`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        code: 'role_struct',
        title: 'Yapılandırılmış rol',
        description: 'Açıklama',
        requirements: {
          requiredDocumentTypes: ['drivers_license'],
          driversLicenseClasses: ['B'],
          srcRequired: true,
        },
      });
    expect([200, 201]).toContain(createOcc.status);
    expect(createOcc.body.data.requirements.srcRequired).toBe(true);

    const tree = await request(app.getHttpServer())
      .get('/api/v1/admin/catalog')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(tree.status).toBe(200);
    const sectorRow = tree.body.data.sectors.find(
      (row: { id: string }) => row.id === sectorId,
    );
    expect(sectorRow?.occupations.some((o: { code: string }) => o.code === 'role_struct')).toBe(
      true,
    );

    const occId = createOcc.body.data.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/catalog/occupations/${occId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ title: 'Güncellenmiş rol' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/catalog/occupations/${occId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/catalog/sectors/${sectorId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
  });

  it('POST /admin/catalog creates item and GET /job-catalog lists active only', async () => {
    const sector = `test_${Date.now()}`;
    const create = await request(app.getHttpServer())
      .post('/api/v1/admin/catalog')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        sectorCode: sector,
        occupationCode: 'role_a',
        title: 'Test pozisyon',
        sortOrder: 1,
      });
    expect([200, 201]).toContain(create.status);
    expect(create.body.data.code).toBe('role_a');

    const tree = await request(app.getHttpServer())
      .get('/api/v1/admin/catalog')
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(tree.status).toBe(200);
    const sectorRow = tree.body.data.sectors.find(
      (row: { code: string }) => row.code === sector,
    );
    expect(sectorRow).toBeDefined();

    const deactivate = await request(app.getHttpServer())
      .patch(`/api/v1/admin/catalog/occupations/${create.body.data.id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ active: false });
    expect(deactivate.status).toBe(200);

    const publicList = await request(app.getHttpServer()).get('/api/v1/job-catalog');
    expect(publicList.status).toBe(200);
    const ids = publicList.body.data.items.map((row: { id: string }) => row.id);
    expect(ids).not.toContain(create.body.data.id);
  });
});
