import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PARTON_E2E_S3_ENDPOINT_FILE } from './global-setup-s3.js';

const firebaseFixture = join(
  import.meta.dirname,
  'fixtures',
  'firebase-service-account.json',
);
const firebaseJson = readFileSync(firebaseFixture, 'utf8');
const firebaseParsed = JSON.parse(firebaseJson) as { project_id?: string };

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://parton:parton@localhost:5432/parton?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-jwt-secret-32-chars-minimum!!';
process.env.JWT_ACCESS_TTL_SECONDS = process.env.JWT_ACCESS_TTL_SECONDS ?? '1800';
process.env.JWT_REFRESH_TTL_DAYS = process.env.JWT_REFRESH_TTL_DAYS ?? '30';
process.env.OTP_PEPPER = process.env.OTP_PEPPER ?? 'test-otp-pepper-16-chars';
process.env.CORS_ORIGINS =
  process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174';
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? 'false';
process.env.TOKEN_STARTING_BALANCE = process.env.TOKEN_STARTING_BALANCE ?? '100';
process.env.TOKEN_TOPUP_LEDGER_CREDIT =
  process.env.TOKEN_TOPUP_LEDGER_CREDIT ?? 'true';
process.env.FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ?? firebaseParsed.project_id ?? 'parton-test';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? firebaseJson;
process.env.OUTBOX_DRAIN_INTERVAL_MS =
  process.env.OUTBOX_DRAIN_INTERVAL_MS ?? '500';
process.env.RATING_OPEN_DELAY_HOURS =
  process.env.RATING_OPEN_DELAY_HOURS ?? '24';
process.env.RATING_SCHEDULER_INTERVAL_MS =
  process.env.RATING_SCHEDULER_INTERVAL_MS ?? '500';
if (!process.env.S3_ENDPOINT && existsSync(PARTON_E2E_S3_ENDPOINT_FILE)) {
  process.env.S3_ENDPOINT = readFileSync(
    PARTON_E2E_S3_ENDPOINT_FILE,
    'utf8',
  ).trim();
}
process.env.S3_ENDPOINT =
  process.env.S3_ENDPOINT ?? 'http://127.0.0.1:19000';
process.env.S3_REGION = process.env.S3_REGION ?? 'us-east-1';
process.env.S3_ACCESS_KEY_ID =
  process.env.S3_ACCESS_KEY_ID ?? 'S3RVER';
process.env.S3_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY ?? 'S3RVER';
process.env.S3_BUCKET = process.env.S3_BUCKET ?? 'parton-documents-test';
process.env.SSE_HEARTBEAT_INTERVAL_MS =
  process.env.SSE_HEARTBEAT_INTERVAL_MS ?? '5000';
process.env.SSE_TICKET_TTL_SECONDS =
  process.env.SSE_TICKET_TTL_SECONDS ?? '120';
process.env.BULLMQ_ENABLED = process.env.BULLMQ_ENABLED ?? 'false';
process.env.WORKER_DOCUMENT_MAX_BYTES =
  process.env.WORKER_DOCUMENT_MAX_BYTES ?? '10485760';
process.env.WORKER_DOCUMENT_ALLOWED_MIME =
  process.env.WORKER_DOCUMENT_ALLOWED_MIME ??
  'application/pdf,image/jpeg,image/png';
process.env.LEGAL_AUDIT_RETENTION_DAYS =
  process.env.LEGAL_AUDIT_RETENTION_DAYS ?? '2555';
process.env.PARTON_RELEASE = process.env.PARTON_RELEASE ?? 'test';
process.env.PARTON_GIT_SHA = process.env.PARTON_GIT_SHA ?? 'test-sha';
process.env.PARTON_MCP_API_KEY =
  process.env.PARTON_MCP_API_KEY ?? 'test-mcp-api-key-16chars';
