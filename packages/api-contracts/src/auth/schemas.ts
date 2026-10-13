import { z } from 'zod';

import { successEnvelopeSchema } from '../envelope.js';

export const adminPasswordLoginBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(128),
});

export type AdminPasswordLoginBody = z.infer<typeof adminPasswordLoginBodySchema>;

export const otpRequestBodySchema = z.object({
  phone: z.string().min(8).max(20),
  purpose: z
    .enum([
      'login',
      'register',
      'admin_login',
      'verify_phone',
      'step_up',
      'password_reset',
    ])
    .optional(),
});

export type OtpRequestBody = z.infer<typeof otpRequestBodySchema>;

export const otpRequestDataSchema = z.object({
  challengeId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  resendAvailableAt: z.string().datetime().optional(),
});

export const otpRequestResponseSchema = successEnvelopeSchema(otpRequestDataSchema);

export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

export const userRoleSchema = z.enum(['worker', 'employer', 'manager', 'admin']);

export const otpVerifyBodySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d{6}$/),
  password: z.string().min(8).max(128).optional(),
  roleIntent: userRoleSchema.optional(),
  deviceId: z.string().min(8).max(256).optional(),
});

export const setPasswordBodySchema = z.object({
  password: z.string().min(8).max(128),
});

export type SetPasswordBody = z.infer<typeof setPasswordBodySchema>;

export const setPasswordDataSchema = z.object({
  ok: z.literal(true),
});

export const setPasswordResponseSchema = successEnvelopeSchema(
  setPasswordDataSchema,
);

export const phonePasswordLoginBodySchema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(128),
});

export type PhonePasswordLoginBody = z.infer<typeof phonePasswordLoginBodySchema>;

export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;

export type UserRole = z.infer<typeof userRoleSchema>;

export const managerPermissionSchema = z.enum([
  'jobs.create',
  'jobs.read',
  'jobs.update',
  'jobs.delete',
  'branches.create',
  'branches.update',
  'branches.delete',
  'tokens.purchase',
  'tokens.refund',
]);

export type ManagerPermission = z.infer<typeof managerPermissionSchema>;

export const MANAGER_PERMISSIONS = managerPermissionSchema.options;

export const legacyManagerPermissions: ManagerPermission[] = [
  'jobs.create',
  'jobs.read',
  'jobs.update',
  'jobs.delete',
  'tokens.refund',
];

export const workplaceManagerInviteDefaultPermissions: ManagerPermission[] = [
  'jobs.create',
  'jobs.read',
  'jobs.update',
  'branches.create',
  'branches.update',
  'branches.delete',
  'tokens.purchase',
];

export const branchManagerInviteDefaultPermissions: ManagerPermission[] = [
  'jobs.create',
  'jobs.read',
  'jobs.update',
];

export const authContextSchema = z.object({
  role: userRoleSchema,
  employerId: z.string().uuid().optional(),
  branchIds: z.array(z.string().uuid()).optional(),
  label: z.string().optional(),
  permissions: z.array(managerPermissionSchema).optional(),
});

export type AuthContext = z.infer<typeof authContextSchema>;

export const meUserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  locale: z.string().optional(),
  email: z.string().nullable().optional(),
  status: z.enum(['active', 'restricted', 'banned']).optional(),
  deletionRequestedAt: z.string().datetime().nullable().optional(),
  roles: z.array(userRoleSchema),
  employerPublicCode: z.string().length(8).nullable().optional(),
  workerPublicCode: z.string().length(8).nullable().optional(),
});

export type MeUser = z.infer<typeof meUserSchema>;

export const otpVerifyDataSchema = z.object({
  accessToken: z.string().min(1),
  accessExpiresAt: z.string().datetime().optional(),
  tokenType: z.literal('Bearer').optional(),
  refreshToken: z.string().min(1).optional(),
  user: meUserSchema,
  contexts: z.array(authContextSchema).optional(),
});

export const otpVerifyResponseSchema = successEnvelopeSchema(otpVerifyDataSchema);

export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

export const tokenRefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type TokenRefreshBody = z.infer<typeof tokenRefreshBodySchema>;

export const tokenRefreshDataSchema = z.object({
  accessToken: z.string().min(1),
  accessExpiresAt: z.string().datetime().optional(),
  tokenType: z.literal('Bearer').optional(),
  refreshToken: z.string().min(1).optional(),
});

export const tokenRefreshResponseSchema =
  successEnvelopeSchema(tokenRefreshDataSchema);

export type TokenRefreshResponse = z.infer<typeof tokenRefreshResponseSchema>;

export const assignRoleBodySchema = z.object({
  role: userRoleSchema,
});

export type AssignRoleBody = z.infer<typeof assignRoleBodySchema>;

export const policyDocumentSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  version: z.string(),
  required: z.boolean(),
  contentUrl: z.string().url().optional(),
});

export type PolicyDocument = z.infer<typeof policyDocumentSchema>;

export const policiesListDataSchema = z.object({
  items: z.array(policyDocumentSchema),
});

export const policiesListResponseSchema = successEnvelopeSchema(
  policiesListDataSchema,
);

export type PoliciesListResponse = z.infer<typeof policiesListResponseSchema>;

export const policyReadBodySchema = z.object({
  policyId: z.string().uuid(),
  version: z.string().min(1).max(32),
  reachedEnd: z.literal(true),
});

export type PolicyReadBody = z.infer<typeof policyReadBodySchema>;

export const policyReadDataSchema = z.object({
  readAt: z.string().datetime(),
  version: z.string(),
});

export const policyReadResponseSchema = successEnvelopeSchema(policyReadDataSchema);

export const policyAcceptanceBodySchema = z.object({
  policyId: z.string().uuid(),
  version: z.string().min(1).max(32),
});

export type PolicyAcceptanceBody = z.infer<typeof policyAcceptanceBodySchema>;

export const policyAcceptanceDataSchema = z.object({
  acceptedAt: z.string().datetime(),
});

export const policyAcceptanceResponseSchema = successEnvelopeSchema(
  policyAcceptanceDataSchema,
);

export const meResponseSchema = successEnvelopeSchema(meUserSchema);

export type MeResponse = z.infer<typeof meResponseSchema>;

export const mePatchBodySchema = z.object({
  locale: z.string().min(2).max(10).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email()).nullable().optional(),
});

export const meDeletionRequestBodySchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

export type MeDeletionRequestBody = z.infer<typeof meDeletionRequestBodySchema>;

export type MePatchBody = z.infer<typeof mePatchBodySchema>;

export const assignRoleDataSchema = z.object({
  user: meUserSchema,
  contexts: z.array(authContextSchema),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const assignRoleResponseSchema =
  successEnvelopeSchema(assignRoleDataSchema);

export type AssignRoleResponse = z.infer<typeof assignRoleResponseSchema>;

export const contextSwitchBodySchema = authContextSchema;

export type ContextSwitchBody = z.infer<typeof contextSwitchBodySchema>;

export const contextsListDataSchema = z.object({
  items: z.array(authContextSchema),
});

export const contextsListResponseSchema =
  successEnvelopeSchema(contextsListDataSchema);

export type ContextsListResponse = z.infer<typeof contextsListResponseSchema>;

export const contextSwitchDataSchema = z.object({
  accessToken: z.string().min(1),
  accessExpiresAt: z.string().datetime().optional(),
  tokenType: z.literal('Bearer').optional(),
  user: meUserSchema,
  contexts: z.array(authContextSchema),
});

export const contextSwitchResponseSchema = successEnvelopeSchema(
  contextSwitchDataSchema,
);

export type ContextSwitchResponse = z.infer<typeof contextSwitchResponseSchema>;

export const identityProviderSchema = z.enum(['apple', 'google']);

export type IdentityProvider = z.infer<typeof identityProviderSchema>;

export const identityLinkBodySchema = z.object({
  provider: identityProviderSchema,
  idToken: z.string().min(20).max(8192),
});

export type IdentityLinkBody = z.infer<typeof identityLinkBodySchema>;

export const identityLoginBodySchema = identityLinkBodySchema.extend({
  deviceId: z.string().min(8).max(256).optional(),
});

export type IdentityLoginBody = z.infer<typeof identityLoginBodySchema>;

export const identityLinkDataSchema = z.object({
  provider: identityProviderSchema,
  linked: z.literal(true),
});

export const identityLinkResponseSchema = successEnvelopeSchema(
  identityLinkDataSchema,
);

export const identityListDataSchema = z.object({
  items: z.array(
    z.object({
      provider: identityProviderSchema,
      email: z.string().nullable(),
    }),
  ),
});

export const identityListResponseSchema = successEnvelopeSchema(
  identityListDataSchema,
);

export const identityProvidersDataSchema = z.object({
  appleClientId: z.string().nullable(),
  googleClientId: z.string().nullable(),
});

export const identityProvidersResponseSchema = successEnvelopeSchema(
  identityProvidersDataSchema,
);
