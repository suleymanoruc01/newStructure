import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const legalAuditCategorySchema = z.enum([
  'auth',
  'policy',
  'admin_action',
  'privacy_dsr',
  'token_adjust',
  'document_admin',
  'notify_broadcast',
  'audit_export',
]);

export const auditEventSchema = z.object({
  id: z.string().uuid(),
  category: legalAuditCategorySchema,
  action: z.string(),
  actorUserId: z.string().uuid().nullable().optional(),
  actorRole: z.string().nullable().optional(),
  resourceType: z.string().nullable().optional(),
  resourceId: z.string().uuid().nullable().optional(),
  requestId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

export const auditEventsListQuerySchema = z.object({
  category: legalAuditCategorySchema.optional(),
  actorUserId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const auditEventsListDataSchema = z.object({
  items: z.array(auditEventSchema),
});

export const auditEventsListResponseSchema = successEnvelopeSchema(
  auditEventsListDataSchema,
);

export const auditEventDetailResponseSchema =
  successEnvelopeSchema(auditEventSchema);

export const auditReportCreateSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  categories: z.array(legalAuditCategorySchema).min(1),
  actorUserId: z.string().uuid().optional(),
  format: z.enum(['csv', 'pdf']),
});

export type AuditReportCreateBody = z.infer<typeof auditReportCreateSchema>;

export const auditReportCreateDataSchema = z.object({
  reportId: z.string().uuid(),
  format: z.enum(['csv', 'pdf']),
  downloadToken: z.string(),
  expiresAt: z.string().datetime(),
});

export const auditReportCreateResponseSchema = successEnvelopeSchema(
  auditReportCreateDataSchema,
);
