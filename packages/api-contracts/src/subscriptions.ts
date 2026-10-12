import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const employerSubscriptionPlanCodeSchema = z.enum([
  'free',
  'starter',
  'professional',
  'enterprise',
]);

export const employerSubscriptionStatusSchema = z.enum([
  'active',
  'cancelled',
  'past_due',
  'trialing',
]);

export const employerSubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  planCode: employerSubscriptionPlanCodeSchema,
  displayName: z.string(),
  monthlyPriceTry: z.number().int(),
  yearlyPriceTry: z.number().int(),
  maxBranches: z.number().int(),
  maxMemberships: z.number().int(),
  tokenBonusOnPurchase: z.number().int(),
  prioritySupport: z.boolean(),
  analyticsAccess: z.boolean(),
  apiAccess: z.boolean(),
  isActive: z.boolean(),
  updatedAt: z.string().datetime(),
});

export const adminSubscriptionPlansListDataSchema = z.object({
  items: z.array(employerSubscriptionPlanSchema),
});

export const adminSubscriptionPlansListResponseSchema = successEnvelopeSchema(
  adminSubscriptionPlansListDataSchema,
);

export const adminSubscriptionPlanPatchSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  monthlyPriceTry: z.number().int().nonnegative().optional(),
  yearlyPriceTry: z.number().int().nonnegative().optional(),
  maxBranches: z.number().int().positive().optional(),
  maxMemberships: z.number().int().positive().optional(),
  tokenBonusOnPurchase: z.number().int().nonnegative().optional(),
  prioritySupport: z.boolean().optional(),
  analyticsAccess: z.boolean().optional(),
  apiAccess: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type AdminSubscriptionPlanPatchBody = z.infer<
  typeof adminSubscriptionPlanPatchSchema
>;

export const adminEmployerSubscriptionPatchSchema = z.object({
  planCode: employerSubscriptionPlanCodeSchema,
  status: employerSubscriptionStatusSchema.optional(),
  subscriptionEndsAt: z.string().datetime().nullable().optional(),
});

export type AdminEmployerSubscriptionPatchBody = z.infer<
  typeof adminEmployerSubscriptionPatchSchema
>;
