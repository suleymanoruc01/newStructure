import { z } from 'zod';

import { managerPermissionSchema } from './auth/schemas.js';
import { successEnvelopeSchema } from './envelope.js';
import { ianaTimeZoneSchema } from './platform.js';

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

export const adminEmployerPatchSchema = z.object({
  legalName: z.string().trim().min(2).max(200).optional(),
  tradingName: z.string().trim().min(2).max(200).nullable().optional(),
  addressLine1: z.string().trim().min(2).max(240).nullable().optional(),
  city: z.string().trim().min(2).max(80).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type AdminEmployerPatchBody = z.infer<typeof adminEmployerPatchSchema>;

export const adminApplicationStatusPatchSchema = z.object({
  status: z.enum(['rejected', 'accepted', 'accept_revoked', 'withdrawn']),
  reason: z.string().trim().min(1).max(500),
});

export type AdminApplicationStatusPatchBody = z.infer<
  typeof adminApplicationStatusPatchSchema
>;

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

export type AdminSmsSettingsBody = z.infer<typeof adminSmsSettingsPatchSchema>;

export const adminDashboardBusinessSchema = z.object({
  totalUsers: z.number().int(),
  totalEmployers: z.number().int(),
  publishedJobs: z.number().int(),
  totalApplications: z.number().int(),
  acceptedApplications: z.number().int(),
  completedShifts: z.number().int(),
  topUpTokensToday: z.number().int(),
  estimatedRevenueTryMonth: z.number().int(),
});

export const adminDashboardTrendsSchema = z.object({
  dayKeys: z.array(z.string()),
  newUsersByDay: z.array(z.number().int()),
  applicationsByDay: z.array(z.number().int()),
  topUpTokensByDay: z.array(z.number().int()),
});

export const adminDashboardDataSchema = z.object({
  openAbuseReports: z.number().int(),
  openDisputes: z.number().int(),
  pendingVerification: z.number().int(),
  outboxPending: z.number().int(),
  openDevopsErrors: z.number().int(),
  queuedRatings: z.number().int(),
  openSupportTickets: z.number().int(),
  business: adminDashboardBusinessSchema,
  trends: adminDashboardTrendsSchema,
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

export const adminTokenAllocateSchema = z.object({
  amount: z.number().int().min(1).max(100_000),
  target: z.enum(['workplace', 'branch']),
  branchId: z.string().uuid().optional(),
  ownerUserId: z.string().uuid().optional(),
});

export type AdminTokenAllocateBody = z.infer<typeof adminTokenAllocateSchema>;

export const adminTokenRequestPatchSchema = z.object({
  action: z.enum(['approve', 'reject']),
  amount: z.number().int().min(1).max(100_000).optional(),
});

export type AdminTokenRequestPatchBody = z.infer<
  typeof adminTokenRequestPatchSchema
>;

export const adminManagerPatchSchema = z.object({
  permissions: z.array(managerPermissionSchema).optional(),
  status: z.enum(['active', 'revoked']).optional(),
  scope: z.enum(['workplace', 'branch']).optional(),
  branchId: z.string().uuid().optional(),
});

export type AdminManagerPatchBody = z.infer<typeof adminManagerPatchSchema>;

export const adminBroadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  audience: z.enum(['all_workers', 'all_employers']),
});

export const integrationStatusSchema = z.enum(['up', 'degraded', 'down']);

export const integrationProbeDataSchema = z.object({
  name: z.string(),
  status: integrationStatusSchema,
  detail: z.string(),
});

export type IntegrationProbeData = z.infer<typeof integrationProbeDataSchema>;

export const integrationProbeResponseSchema = successEnvelopeSchema(
  integrationProbeDataSchema,
);

export const adminSmsSettingsDataSchema = z.object({
  verimorEnabled: z.boolean(),
  username: z.string(),
  header: z.string(),
  passwordSet: z.boolean(),
  fallbackOtp: z.literal('290821'),
  active: z.boolean(),
});

export const adminSmsSettingsPatchSchema = z.object({
  verimorEnabled: z.boolean(),
  username: z.string().trim().max(64),
  header: z.string().trim().max(20),
  password: z.string().max(200).optional(),
});

export const adminSmsSettingsResponseSchema = successEnvelopeSchema(
  adminSmsSettingsDataSchema,
);

export const adminAdaptySettingsDataSchema = z.object({
  enabled: z.boolean(),
  publicSdkKey: z.string(),
  placementId: z.string(),
  appleStoreConnected: z.boolean(),
  googleStoreConnected: z.boolean(),
  secretSet: z.boolean(),
  webhookAuthorizationSet: z.boolean(),
  webhookPath: z.literal('/api/v1/webhooks/adapty'),
  active: z.boolean(),
});

export const adminAdaptySettingsPatchSchema = z.object({
  enabled: z.boolean(),
  publicSdkKey: z.string().trim().max(200),
  placementId: z.string().trim().max(120),
  appleStoreConnected: z.boolean(),
  googleStoreConnected: z.boolean(),
  secretKey: z.string().max(400).optional(),
  webhookAuthorization: z.string().max(400).optional(),
});

export type AdminAdaptySettingsBody = z.infer<
  typeof adminAdaptySettingsPatchSchema
>;

export const adminAdaptySettingsResponseSchema = successEnvelopeSchema(
  adminAdaptySettingsDataSchema,
);

export const adminRemoteConfigSchema = z.object({
  geofenceRadiusM: z.number().int().positive(),
  geofenceSoftRadiusM: z.number().int().positive(),
  geofenceMaxAccuracyM: z.number().int().positive(),
  checkinEarlyMinutes: z.number().int().nonnegative(),
  checkinLateMinutes: z.number().int().nonnegative(),
  maintenanceMode: z.boolean(),
  minMobileIosVersion: z.string().nullable().optional(),
  minMobileAndroidVersion: z.string().nullable().optional(),
  timeZone: ianaTimeZoneSchema,
});

export const adminMatchingDiagnosticsQuerySchema = z.object({
  jobId: z.string().uuid(),
  workerUserId: z.string().uuid(),
});

export const adminMatchingDiagnosticsDataSchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(z.string()),
  matchReasons: z.array(z.string()),
  distanceKm: z.number().nullable().optional(),
  jobFavoritesOnly: z.boolean(),
  workerNightShiftAvailable: z.boolean(),
  workerUploadedDocumentTypes: z.array(z.string()),
});

export const adminMatchingDiagnosticsResponseSchema = successEnvelopeSchema(
  adminMatchingDiagnosticsDataSchema,
);

export const adminPolicyPatchSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
});

export type AdminPolicyPatchBody = z.infer<typeof adminPolicyPatchSchema>;

export const adminJobPatchSchema = z.object({
  favoritesOnly: z.boolean(),
});

export type AdminJobPatchBody = z.infer<typeof adminJobPatchSchema>;

export const adminWorkerPatchSchema = z.object({
  nightShiftAvailable: z.boolean(),
});

export type AdminWorkerPatchBody = z.infer<typeof adminWorkerPatchSchema>;

export const adminDocumentPatchSchema = z.object({
  status: z.enum(['uploaded', 'rejected']),
});

export type AdminDocumentPatchBody = z.infer<typeof adminDocumentPatchSchema>;

export const adminDisputePatchSchema = z.object({
  status: z.enum(['resolved', 'rejected']),
});

export type AdminDisputePatchBody = z.infer<typeof adminDisputePatchSchema>;
