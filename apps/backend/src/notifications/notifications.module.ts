import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { DeviceTokensController } from './device-tokens.controller.js';
import { FcmDispatcherService } from './fcm-dispatcher.service.js';
import { FirebaseAdminProvider } from './firebase-admin.provider.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { OutboxDrainService } from './outbox-drain.service.js';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, DeviceTokensController],
  providers: [
    NotificationsService,
    FirebaseAdminProvider,
    FcmDispatcherService,
    OutboxDrainService,
  ],
  exports: [NotificationsService, OutboxDrainService],
})
export class NotificationsModule {}
