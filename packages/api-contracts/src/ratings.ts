import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const ratingScoreSchema = z.number().int().min(1).max(5);

export const ratingCreateSchema = z.object({
  shiftId: z.string().uuid(),
  score: ratingScoreSchema,
  comment: z.string().max(2000).optional(),
});

export type RatingCreateBody = z.infer<typeof ratingCreateSchema>;

export const ratingModerationStatusSchema = z.enum([
  'visible',
  'queued',
  'rejected',
]);

export const ratingItemSchema = z.object({
  id: z.string().uuid(),
  shiftId: z.string().uuid(),
  score: ratingScoreSchema,
  comment: z.string().nullable().optional(),
  moderationStatus: ratingModerationStatusSchema,
  createdAt: z.string().datetime(),
});

export type RatingItem = z.infer<typeof ratingItemSchema>;

export const ratingPendingItemSchema = z.object({
  shiftId: z.string().uuid(),
  jobId: z.string().uuid(),
  jobTitle: z.string().nullable().optional(),
  branchId: z.string().uuid().nullable(),
  branchName: z.string().nullable().optional(),
  counterpartLabel: z.string(),
  opensAt: z.string().datetime(),
});

export type RatingPendingItem = z.infer<typeof ratingPendingItemSchema>;

export const ratingsPendingDataSchema = z.object({
  items: z.array(ratingPendingItemSchema),
});

export const ratingsPendingResponseSchema = successEnvelopeSchema(
  ratingsPendingDataSchema,
);

export const ratingCreateDataSchema = ratingItemSchema;

export const ratingCreateResponseSchema = successEnvelopeSchema(
  ratingCreateDataSchema,
);

export const ratingAverageDataSchema = z.object({
  average: z.number().nullable(),
  count: z.number().int().nonnegative(),
});

export const ratingAverageResponseSchema = successEnvelopeSchema(
  ratingAverageDataSchema,
);
