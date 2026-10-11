import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const workerDocumentTypeSchema = z.enum([
  'id_card',
  'criminal_record',
  'health_report',
  'food_hygiene',
  'drivers_license',
  'other',
]);

export type WorkerDocumentType = z.infer<typeof workerDocumentTypeSchema>;

export const workerDocumentStatusSchema = z.enum([
  'pending_upload',
  'uploaded',
]);

export const workerDocumentCreateSchema = z.object({
  documentType: workerDocumentTypeSchema,
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(127),
  sizeBytes: z.number().int().positive(),
});

export type WorkerDocumentCreateBody = z.infer<
  typeof workerDocumentCreateSchema
>;

export const workerDocumentSchema = z.object({
  id: z.string().uuid(),
  documentType: workerDocumentTypeSchema,
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  status: workerDocumentStatusSchema,
  uploadedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type WorkerDocument = z.infer<typeof workerDocumentSchema>;

export const workerDocumentCreateDataSchema = workerDocumentSchema.extend({
  uploadUrl: z.string().url(),
  uploadExpiresAt: z.string().datetime(),
});

export const workerDocumentCreateResponseSchema = successEnvelopeSchema(
  workerDocumentCreateDataSchema,
);

export const workerDocumentsListDataSchema = z.object({
  items: z.array(workerDocumentSchema),
});

export const workerDocumentsListResponseSchema = successEnvelopeSchema(
  workerDocumentsListDataSchema,
);

export const workerDocumentResponseSchema = successEnvelopeSchema(
  workerDocumentSchema,
);

export const workerDocumentDownloadDataSchema = z.object({
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

export const workerDocumentDownloadResponseSchema = successEnvelopeSchema(
  workerDocumentDownloadDataSchema,
);
