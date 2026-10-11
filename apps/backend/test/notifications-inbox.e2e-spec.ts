import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { TokenService } from '../src/auth/token.service.js';
import { FcmDispatcherService } from '../src/notifications/fcm-dispatcher.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Inbox when push is off (e2e) T-111', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fcm: FcmDispatcherService;
  let access: string;
  let userId: string;
  let notificationId: string;

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
    fcm = moduleRef.get(FcmDispatcherService);
    const tokens = moduleRef.get(TokenService);
    const user = await prisma.user.create({
      data: { phoneE164: `+905574${Date.now().toString().slice(-7)}` },
    });
    userId = user.id;
    const sessionId = (
      await prisma.refreshSession.create({
        data: {
          userId,
          tokenHash: 't111-inbox',
          expiresAt: new Date(Date.now() + 86400000),
          activeContext: { role: 'worker' },
        },
      })
    ).id;
    access = tokens.signAccess(userId, sessionId, { role: 'worker' }).accessToken;
    const row = await prisma.notification.create({
      data: {
        userId,
        type: 'shift.manual_confirmed',
        title: 'Manuel onay',
        body: 'Vardiya onaylandı',
        dedupeKey: `t111:${userId}`,
        data: { shiftId: '00000000-0000-4000-8000-000000000001' },
      },
    });
    notificationId = row.id;
    await prisma.devicePushToken.create({
      data: {
        userId,
        token: `t111-device-token-${userId.replace(/-/g, '')}`,
        platform: 'android',
      },
    });
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  it('returns the inbox row and does not send FCM when the shift pref is off', async () => {
    const prefs = await request(app.getHttpServer())
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${access}`)
      .send({ shifts: false });
    expect(prefs.status).toBe(200);
    expect(prefs.body.data.shifts).toBe(false);

    await fcm.dispatchNotification(notificationId);
    const stored = await prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
    });
    expect(stored.fcmMessageId).toBeNull();
    expect(stored.deliveryAttempts).toBe(0);

    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${access}`);
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as { id: string }[]).map((item) => item.id);
    expect(ids).toContain(notificationId);

    const read = await request(app.getHttpServer())
      .post(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${access}`);
    expect([200, 201]).toContain(read.status);
    expect(read.body.data.readAt).toBeTruthy();
  });
});
