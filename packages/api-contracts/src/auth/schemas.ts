import { z } from 'zod';

import { successEnvelopeSchema } from '../envelope.js';

export const otpRequestBodySchema = z.object({
  phone: z.string().min(8).max(20),
  purpose: z
    .enum(['login', 'register', 'admin_login', 'verify_phone', 'step_up'])
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
  roleIntent: userRoleSchema.optional(),
  deviceId: z.string().min(8).max(256).optional(),
});

export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;

export type UserRole = z.infer<typeof userRoleSchema>;

export const authContextSchema = z.object({
  role: userRoleSchema,
  employerId: z.string().uuid().optional(),
  branchIds: z.array(z.string().uuid()).optional(),
});

export type AuthContext = z.infer<typeof authContextSchema>;

export const meUserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  locale: z.string().optional(),
  roles: z.array(userRoleSchema),
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

export const policyAcceptanceBodySchema = z.object({
  policyIds: z.array(z.string().uuid()).min(1),
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
});

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
