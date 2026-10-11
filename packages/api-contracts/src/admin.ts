import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  phoneE164: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
  createdAt: z.string().datetime(),
});

export const adminUsersListDataSchema = z.object({
  items: z.array(adminUserSummarySchema),
});

export const adminUsersListResponseSchema = successEnvelopeSchema(
  adminUsersListDataSchema,
);

export const adminUserPatchSchema = z.object({
  status: z.enum(['active', 'restricted', 'banned']).optional(),
});

export type AdminUserPatchBody = z.infer<typeof adminUserPatchSchema>;

export type AdminVerificationPatchBody = z.infer<
  typeof adminVerificationPatchSchema
>;

export type AdminJobForceCloseBody = z.infer<typeof adminJobForceCloseSchema>;

export type AdminRatingModerationPatchBody = z.infer<
  typeof adminRatingModerationPatchSchema
>;

export type AdminTokenCreditBody = z.infer<typeof adminTokenCreditSchema>;

export type AdminBroadcastBody = z.infer<typeof adminBroadcastSchema>;

export type AdminRemoteConfigBody = z.infer<typeof adminRemoteConfigSchema>;

export const adminDashboardDataSchema = z.object({
  openAbuseReports: z.number().int(),
  openDisputes: z.number().int(),
  pendingVerification: z.number().int(),
  outboxPending: z.number().int(),
  openDevopsErrors: z.number().int(),
  queuedRatings: z.number().int(),
});

export const adminDashboardResponseSchema = successEnvelopeSchema(
  adminDashboardDataSchema,
);

export const adminVerificationPatchSchema = z.object({
  verificationStatus: z.enum(['verified', 'rejected', 'bypass']),
});

export const adminJobForceCloseSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const adminRatingModerationPatchSchema = z.object({
  moderationStatus: z.enum(['visible', 'rejected']),
});

export const adminTokenCreditSchema = z.object({
  amount: z.number().int().positive(),
  note: z.string().min(1).max(500),
});

export const adminBroadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  audience: z.enum(['all_workers', 'all_employers']),
});

export const adminRemoteConfigSchema = z.object({
  geofenceRadiusM: z.number().int().positive(),
  geofenceSoftRadiusM: z.number().int().positive(),
  maintenanceMode: z.boolean(),
  minMobileIosVersion: z.string().nullable().optional(),
  minMobileAndroidVersion: z.string().nullable().optional(),
});

export const adminMatchingDiagnosticsQuerySchema = z.object({
  jobId: z.string().uuid(),
  workerUserId: z.string().uuid(),
});

export const adminMatchingDiagnosticsDataSchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(z.string()),
  matchReasons: z.array(z.string()),
});

export const adminMatchingDiagnosticsResponseSchema = successEnvelopeSchema(
  adminMatchingDiagnosticsDataSchema,
);
