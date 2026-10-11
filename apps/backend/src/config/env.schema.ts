import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_PEPPER: z.string().min(16),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_FROM_NUMBER: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REFRESH_COOKIE_NAME: z.string().default('refresh'),
  CSRF_COOKIE_NAME: z.string().default('csrf'),
  TOKEN_STARTING_BALANCE: z.coerce.number().int().nonnegative().default(100),
  TOKEN_TOPUP_LEDGER_CREDIT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(2),
  OUTBOX_DRAIN_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30),
  AVAILABILITY_CONFIRM_HOURS: z.coerce.number().int().positive().default(3),
  GEOFENCE_RADIUS_M: z.coerce.number().int().positive().default(100),
  GEOFENCE_MAX_ACCURACY_M: z.coerce.number().int().positive().default(80),
  GEOFENCE_SOFT_RADIUS_M: z.coerce.number().int().positive().default(150),
  CHECKIN_EARLY_MINUTES: z.coerce.number().int().nonnegative().default(15),
  CHECKIN_LATE_MINUTES: z.coerce.number().int().nonnegative().default(30),
  CHECKIN_DUE_MINUTES: z.coerce.number().int().positive().default(10),
  SHIFT_SCHEDULER_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  APPLY_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  APPLY_RATE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATING_OPEN_DELAY_HOURS: z.coerce.number().int().positive().default(24),
  RATING_SCHEDULER_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  WORKER_DOCUMENT_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10_485_760),
  WORKER_DOCUMENT_ALLOWED_MIME: z
    .string()
    .default('application/pdf,image/jpeg,image/png'),
  LEGAL_AUDIT_RETENTION_DAYS: z.coerce.number().int().min(365).default(2555),
  LEGAL_AUDIT_RETENTION_FORCE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  PARTON_MCP_API_KEY: z.string().min(16).optional(),
  PARTON_RELEASE: z.string().default('dev'),
  PARTON_GIT_SHA: z.string().default('local'),
  BULLMQ_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REDIS_QUEUE_URL: z.string().url().optional(),
  SSE_TICKET_TTL_SECONDS: z.coerce.number().int().min(30).max(300).default(120),
  SSE_HEARTBEAT_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(5000)
    .max(120_000)
    .default(30_000),
}).superRefine((env, ctx) => {
  if (env.BULLMQ_ENABLED && !env.REDIS_QUEUE_URL) {
    ctx.addIssue({
      code: 'custom',
      path: ['REDIS_QUEUE_URL'],
      message: 'REDIS_QUEUE_URL is required when BULLMQ_ENABLED=true',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}
