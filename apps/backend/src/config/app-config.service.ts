import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema.js';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get env(): Env {
    return {
      NODE_ENV: this.config.get('NODE_ENV', { infer: true }),
      PORT: this.config.get('PORT', { infer: true }),
      DATABASE_URL: this.config.get('DATABASE_URL', { infer: true }),
      JWT_ACCESS_SECRET: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      JWT_ACCESS_TTL_SECONDS: this.config.get('JWT_ACCESS_TTL_SECONDS', {
        infer: true,
      }),
      JWT_REFRESH_TTL_DAYS: this.config.get('JWT_REFRESH_TTL_DAYS', {
        infer: true,
      }),
      OTP_PEPPER: this.config.get('OTP_PEPPER', { infer: true }),
      TWILIO_ACCOUNT_SID: this.config.get('TWILIO_ACCOUNT_SID', {
        infer: true,
      }),
      TWILIO_AUTH_TOKEN: this.config.get('TWILIO_AUTH_TOKEN', { infer: true }),
      TWILIO_FROM_NUMBER: this.config.get('TWILIO_FROM_NUMBER', { infer: true }),
      CORS_ORIGINS: this.config.get('CORS_ORIGINS', { infer: true }),
      COOKIE_SECURE: this.config.get('COOKIE_SECURE', { infer: true }),
      REFRESH_COOKIE_NAME: this.config.get('REFRESH_COOKIE_NAME', {
        infer: true,
      }),
      CSRF_COOKIE_NAME: this.config.get('CSRF_COOKIE_NAME', { infer: true }),
      TOKEN_STARTING_BALANCE: this.config.get('TOKEN_STARTING_BALANCE', {
        infer: true,
      }),
      TOKEN_TOPUP_LEDGER_CREDIT: this.config.get('TOKEN_TOPUP_LEDGER_CREDIT', {
        infer: true,
      }),
      FIREBASE_PROJECT_ID: this.config.get('FIREBASE_PROJECT_ID', {
        infer: true,
      }),
      FIREBASE_SERVICE_ACCOUNT_JSON: this.config.get(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
        { infer: true },
      ),
      OUTBOX_DRAIN_INTERVAL_MS: this.config.get('OUTBOX_DRAIN_INTERVAL_MS', {
        infer: true,
      }),
      AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES: this.config.get(
        'AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES',
        { infer: true },
      ),
      AVAILABILITY_CONFIRM_HOURS: this.config.get('AVAILABILITY_CONFIRM_HOURS', {
        infer: true,
      }),
      GEOFENCE_RADIUS_M: this.config.get('GEOFENCE_RADIUS_M', { infer: true }),
      GEOFENCE_MAX_ACCURACY_M: this.config.get('GEOFENCE_MAX_ACCURACY_M', {
        infer: true,
      }),
      GEOFENCE_SOFT_RADIUS_M: this.config.get('GEOFENCE_SOFT_RADIUS_M', {
        infer: true,
      }),
      CHECKIN_EARLY_MINUTES: this.config.get('CHECKIN_EARLY_MINUTES', {
        infer: true,
      }),
      CHECKIN_LATE_MINUTES: this.config.get('CHECKIN_LATE_MINUTES', {
        infer: true,
      }),
      CHECKIN_DUE_MINUTES: this.config.get('CHECKIN_DUE_MINUTES', {
        infer: true,
      }),
      SHIFT_SCHEDULER_INTERVAL_MS: this.config.get(
        'SHIFT_SCHEDULER_INTERVAL_MS',
        { infer: true },
      ),
      APPLY_RATE_LIMIT: this.config.get('APPLY_RATE_LIMIT', { infer: true }),
      APPLY_RATE_WINDOW_MS: this.config.get('APPLY_RATE_WINDOW_MS', {
        infer: true,
      }),
      RATING_OPEN_DELAY_HOURS: this.config.get('RATING_OPEN_DELAY_HOURS', {
        infer: true,
      }),
      RATING_SCHEDULER_INTERVAL_MS: this.config.get(
        'RATING_SCHEDULER_INTERVAL_MS',
        { infer: true },
      ),
      S3_ENDPOINT: this.config.get('S3_ENDPOINT', { infer: true }),
      S3_REGION: this.config.get('S3_REGION', { infer: true }),
      S3_ACCESS_KEY_ID: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
      S3_SECRET_ACCESS_KEY: this.config.get('S3_SECRET_ACCESS_KEY', {
        infer: true,
      }),
      S3_BUCKET: this.config.get('S3_BUCKET', { infer: true }),
      WORKER_DOCUMENT_MAX_BYTES: this.config.get('WORKER_DOCUMENT_MAX_BYTES', {
        infer: true,
      }),
      WORKER_DOCUMENT_ALLOWED_MIME: this.config.get(
        'WORKER_DOCUMENT_ALLOWED_MIME',
        { infer: true },
      ),
      LEGAL_AUDIT_RETENTION_DAYS: this.config.get(
        'LEGAL_AUDIT_RETENTION_DAYS',
        { infer: true },
      ),
      LEGAL_AUDIT_RETENTION_FORCE: this.config.get(
        'LEGAL_AUDIT_RETENTION_FORCE',
        { infer: true },
      ),
      PARTON_MCP_API_KEY: this.config.get('PARTON_MCP_API_KEY', {
        infer: true,
      }),
      PARTON_RELEASE: this.config.get('PARTON_RELEASE', { infer: true }),
      PARTON_GIT_SHA: this.config.get('PARTON_GIT_SHA', { infer: true }),
      BULLMQ_ENABLED: this.config.get('BULLMQ_ENABLED', { infer: true }),
      REDIS_QUEUE_URL: this.config.get('REDIS_QUEUE_URL', { infer: true }),
      SSE_TICKET_TTL_SECONDS: this.config.get('SSE_TICKET_TTL_SECONDS', {
        infer: true,
      }),
      SSE_HEARTBEAT_INTERVAL_MS: this.config.get('SSE_HEARTBEAT_INTERVAL_MS', {
        infer: true,
      }),
    };
  }

  bullmqEnabled(): boolean {
    return this.env.BULLMQ_ENABLED;
  }

  firebaseServiceAccount(): {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  } {
    const parsed = JSON.parse(this.env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    const projectId = parsed.project_id ?? this.env.FIREBASE_PROJECT_ID;
    const clientEmail = parsed.client_email;
    const privateKey = parsed.private_key;
    if (!clientEmail || !privateKey) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON must include client_email and private_key',
      );
    }
    return { projectId, clientEmail, privateKey };
  }

  corsOriginList(): string[] {
    return this.env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
}
