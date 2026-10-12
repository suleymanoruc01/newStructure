import { z } from 'zod';

import { meUserSchema } from './auth/schemas.js';
import { successEnvelopeSchema } from './envelope.js';

export const branchStatusSchema = z.enum(['active', 'inactive', 'archived']);

export const branchSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  name: z.string(),
  addressLine1: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  status: branchStatusSchema,
});

export type Branch = z.infer<typeof branchSchema>;

export const branchCreateBodySchema = z.object({
  name: z.string().min(2).max(120),
  addressLine1: z.string().min(2).max(240).optional(),
  city: z.string().min(2).max(80).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type BranchCreateBody = z.infer<typeof branchCreateBodySchema>;

export const branchPatchBodySchema = branchCreateBodySchema
  .partial()
  .extend({
    status: branchStatusSchema.optional(),
  });

export type BranchPatchBody = z.infer<typeof branchPatchBodySchema>;

export const branchListDataSchema = z.object({
  items: z.array(branchSchema),
});

export const branchListResponseSchema =
  successEnvelopeSchema(branchListDataSchema);

export type BranchListData = z.infer<typeof branchListDataSchema>;

export const branchCreateResponseSchema = successEnvelopeSchema(
  branchSchema.extend({
    managerInviteCode: z.string().optional(),
  }),
);

export const branchResponseSchema = successEnvelopeSchema(branchSchema);

export const branchDetailSchema = branchSchema.extend({
  managerInviteCode: z.string().optional(),
});

export const branchDetailResponseSchema =
  successEnvelopeSchema(branchDetailSchema);

export const managerJoinBodySchema = z.object({
  code: z.string().min(6).max(16),
});

export type ManagerJoinBody = z.infer<typeof managerJoinBodySchema>;

export const managerJoinBranchPreviewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string().nullable().optional(),
  employerId: z.string().uuid(),
  employerName: z.string(),
});

export const managerJoinDataSchema = z.object({
  branch: managerJoinBranchPreviewSchema,
  accessToken: z.string(),
  accessExpiresAt: z.string(),
  refreshToken: z.string(),
  user: meUserSchema,
});

export const managerJoinResponseSchema =
  successEnvelopeSchema(managerJoinDataSchema);

export const adminBranchCreateBodySchema = branchCreateBodySchema.extend({
  employerId: z.string().uuid(),
});

export type AdminBranchCreateBody = z.infer<typeof adminBranchCreateBodySchema>;

export const adminBranchPatchBodySchema = branchPatchBodySchema;

export type AdminBranchPatchBody = z.infer<typeof adminBranchPatchBodySchema>;
