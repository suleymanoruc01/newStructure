import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
export class FirebaseAdminProvider implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminProvider.name);
  private app: App | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const { projectId, clientEmail, privateKey } =
      this.config.firebaseServiceAccount();
    if (getApps().length > 0) {
      this.app = getApps()[0] ?? null;
      return;
    }
    this.app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    this.logger.log(`Firebase Admin initialized for project ${projectId}`);
  }

  messaging(): Messaging {
    if (!this.app) {
      throw new Error('Firebase Admin not initialized');
    }
    return getMessaging(this.app);
  }
}
