import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const applicationStatusSchema = z.enum([
  'pending',
  'withdrawn',
  'accepted',
  'rejected',
  'accept_revoked',
  'substitute',
]);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const applicationProfileSnapshotSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  birthDate: z.string().nullable(),
  gender: z.string().nullable(),
  sectorCodes: z.array(z.string()),
  occupationCodes: z.array(z.string()),
  capturedAt: z.string().datetime(),
});

export type ApplicationProfileSnapshot = z.infer<
  typeof applicationProfileSnapshotSchema
>;

export const applicationSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  workerUserId: z.string().uuid(),
  status: applicationStatusSchema,
  profileSnapshot: applicationProfileSnapshotSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Application = z.infer<typeof applicationSchema>;

export const applicationApplyBodySchema = z.object({
  acknowledgeOverlap: z.boolean().optional(),
});

export type ApplicationApplyBody = z.infer<typeof applicationApplyBodySchema>;

export const applicationOverlapConflictSchema = z.object({
  applicationId: z.string().uuid(),
  jobId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: applicationStatusSchema,
});

export const applicationApplyResultSchema = z.object({
  application: applicationSchema,
  overlapWarnings: z.array(applicationOverlapConflictSchema).optional(),
});

export type ApplicationApplyResult = z.infer<
  typeof applicationApplyResultSchema
>;

export const candidateScoreBadgeSchema = z.enum([
  'top_talent',
  'verified_pro',
  'rising_star',
  'reliable',
  'standard',
]);

export type CandidateScoreBadge = z.infer<typeof candidateScoreBadgeSchema>;

export const candidateScoreBreakdownSchema = z.object({
  totalScore: z.number().min(0).max(100),
  ratingScore: z.number().min(0).max(100),
  reliabilityScore: z.number().min(0).max(100),
  sectorExperienceScore: z.number().min(0).max(100),
  proximityScore: z.number().min(0).max(100),
  completedShiftsCount: z.number().int().nonnegative(),
  averageRating: z.number().nullable().optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  badge: candidateScoreBadgeSchema,
});

export type CandidateScoreBreakdown = z.infer<
  typeof candidateScoreBreakdownSchema
>;

export const applicationListItemSchema = applicationSchema.extend({
  jobTitle: z.string().nullable().optional(),
  jobStartsAt: z.string().datetime().optional(),
  jobEndsAt: z.string().datetime().optional(),
  workerDisplayName: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
  payAmountMinor: z.number().int().nonnegative().nullable().optional(),
  payCurrency: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  candidateScore: candidateScoreBreakdownSchema.optional(),
});

export type ApplicationListItem = z.infer<typeof applicationListItemSchema>;

export const applicationListDataSchema = z.object({
  items: z.array(applicationListItemSchema),
});

export const applicationListResponseSchema = successEnvelopeSchema(
  applicationListDataSchema,
);

export const applicationApplyDataSchema = z.object({
  application: applicationSchema,
  overlapWarnings: z.array(applicationOverlapConflictSchema).optional(),
});

export const applicationApplyResponseSchema = successEnvelopeSchema(
  applicationApplyDataSchema,
);

export const applicationDetailSchema = applicationSchema.extend({
  jobTitle: z.string().nullable().optional(),
  jobStartsAt: z.string().datetime().optional(),
  jobEndsAt: z.string().datetime().optional(),
  branchName: z.string().optional(),
  workerDisplayName: z.string().nullable().optional(),
  payAmountMinor: z.number().int().nonnegative().nullable().optional(),
  payCurrency: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const applicationResponseSchema = successEnvelopeSchema(
  applicationDetailSchema,
);
