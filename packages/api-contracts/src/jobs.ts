import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const jobStatusSchema = z.enum(['draft', 'published', 'closed']);

export const jobSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  status: jobStatusSchema,
  sectorCode: z.string(),
  occupationCode: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  headcount: z.number().int().positive(),
  remainingHeadcount: z.number().int().nonnegative(),
  payAmountMinor: z.number().int().nonnegative().nullable().optional(),
  payCurrency: z.string(),
  favoritesOnly: z.boolean(),
  genderFilter: z.string().nullable().optional(),
  minAge: z.number().int().nullable().optional(),
  maxAge: z.number().int().nullable().optional(),
  requiredDocumentTypes: z.array(z.string()),
  amenities: z.array(z.string()).optional(),
  instantAutoApprove: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  branchName: z.string().optional(),
  branchLatitude: z.number().optional(),
  branchLongitude: z.number().optional(),
});

export type Job = z.infer<typeof jobSchema>;

export const jobCreateBodySchema = z.object({
  branchId: z.string().uuid().optional(),
  sectorCode: z.string().min(1).max(64),
  occupationCode: z.string().min(1).max(64).optional(),
  title: z.string().min(2).max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  headcount: z.number().int().min(1).max(500),
  payAmountMinor: z.number().int().nonnegative().optional(),
  payCurrency: z.string().min(3).max(3).optional(),
  favoritesOnly: z.boolean().optional(),
  genderFilter: z.enum(['female', 'male']).optional(),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  requiredDocumentTypes: z.array(z.string().min(1).max(64)).optional(),
  amenities: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
  instantAutoApprove: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  publish: z.boolean().optional(),
});

export type JobCreateBody = z.infer<typeof jobCreateBodySchema>;

export const jobPatchBodySchema = jobCreateBodySchema
  .omit({ branchId: true, publish: true })
  .partial()
  .extend({
    status: jobStatusSchema.optional(),
  });

export type JobPatchBody = z.infer<typeof jobPatchBodySchema>;

export const jobEligibilitySchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(z.string()),
});

export const jobDetailSchema = jobSchema.extend({
  eligibility: jobEligibilitySchema.optional(),
  matchReasons: z.array(z.string()).optional(),
  branchName: z.string().optional(),
  branchCity: z.string().nullable().optional(),
  branchLatitude: z.number().optional(),
  branchLongitude: z.number().optional(),
  distanceKm: z.number().nullable().optional(),
  matchScore: z.number().int().min(0).max(100).optional(),
  surgeMultiplier: z.number().optional(),
  feedRankScore: z.number().int().min(0).max(100).optional(),
});

export const jobResponseSchema = successEnvelopeSchema(jobDetailSchema);

export const jobListDataSchema = z.object({
  items: z.array(jobSchema),
});

export const jobListResponseSchema = successEnvelopeSchema(jobListDataSchema);

export const jobFeedItemSchema = jobDetailSchema;

export const jobFeedDataSchema = z.object({
  items: z.array(jobFeedItemSchema),
});

export const branchJobCreateBodySchema = jobCreateBodySchema.omit({
  branchId: true,
});

export type BranchJobCreateBody = z.infer<typeof branchJobCreateBodySchema>;

export const jobFeedResponseSchema = successEnvelopeSchema(jobFeedDataSchema);

export const jobCatalogOccupationPublicSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  title: z.string(),
});

export const jobCatalogSectorPublicSchema = z.object({
  code: z.string(),
  displayName: z.string(),
  icon: z.string(),
  occupations: z.array(jobCatalogOccupationPublicSchema),
});

/** Flat row for job create / matching (sector + occupation codes). */
export const jobCatalogItemSchema = z.object({
  id: z.string().uuid(),
  sectorCode: z.string(),
  occupationCode: z.string(),
  title: z.string(),
});

export const jobCatalogDataSchema = z.object({
  items: z.array(jobCatalogItemSchema),
  sectors: z.array(jobCatalogSectorPublicSchema),
});

export const jobCatalogResponseSchema =
  successEnvelopeSchema(jobCatalogDataSchema);
