import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

/** CASE-ABUSE checklist ids a person can file on `m.shared.abuse.report`. */
export const ABUSE_REPORT_CATEGORIES = [
  'T-181',
  'T-182',
  'T-183',
  'T-184',
  'T-185',
  'T-186',
  'T-187',
  'T-188',
  'T-189',
  'T-190',
  'T-191',
  'T-192',
] as const;

export const abuseReportCategorySchema = z.enum(ABUSE_REPORT_CATEGORIES);

export const moderationReportCreateSchema = z.object({
  category: abuseReportCategorySchema,
  note: z.string().trim().min(10).max(2000),
  targetUserId: z.string().uuid().optional(),
});

export type ModerationReportCreate = z.infer<typeof moderationReportCreateSchema>;

export const moderationReportSchema = z.object({
  id: z.string().uuid(),
  category: abuseReportCategorySchema,
  note: z.string(),
  status: z.literal('open'),
  reporterUserId: z.string().uuid(),
  targetUserId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export const moderationReportResponseSchema = successEnvelopeSchema(
  moderationReportSchema,
);
