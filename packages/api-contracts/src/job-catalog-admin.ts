import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';
import { workerDocumentTypeSchema } from './worker-documents.js';

/** Default occupation requirements (ehliyet/SRC map to document types + flags). */
export const jobCatalogOccupationRequirementsSchema = z
  .object({
    requiredDocumentTypes: z.array(workerDocumentTypeSchema).default([]),
    driversLicenseClasses: z.array(z.string().trim().min(1).max(8)).optional(),
    srcRequired: z.boolean().optional(),
  })
  .strict();

export type JobCatalogOccupationRequirements = z.infer<
  typeof jobCatalogOccupationRequirementsSchema
>;

export const adminJobCatalogOccupationSchema = z.object({
  id: z.string().uuid(),
  sectorId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  requirements: jobCatalogOccupationRequirementsSchema,
  sortOrder: z.number().int(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});

export const adminJobCatalogSectorSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  displayName: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  occupations: z.array(adminJobCatalogOccupationSchema),
});

export const adminJobCatalogTreeDataSchema = z.object({
  sectors: z.array(adminJobCatalogSectorSchema),
});

export const adminJobCatalogTreeResponseSchema = successEnvelopeSchema(
  adminJobCatalogTreeDataSchema,
);

export const adminJobCatalogSectorCreateSchema = z.object({
  code: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(200),
  icon: z.string().trim().min(1).max(16).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogSectorCreateBody = z.infer<
  typeof adminJobCatalogSectorCreateSchema
>;

export const adminJobCatalogSectorPatchSchema = z.object({
  displayName: z.string().trim().min(1).max(200).optional(),
  icon: z.string().trim().min(1).max(16).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogSectorPatchBody = z.infer<
  typeof adminJobCatalogSectorPatchSchema
>;

export const adminJobCatalogOccupationCreateSchema = z.object({
  code: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  requirements: jobCatalogOccupationRequirementsSchema.optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogOccupationCreateBody = z.infer<
  typeof adminJobCatalogOccupationCreateSchema
>;

export const adminJobCatalogOccupationPatchSchema = z.object({
  code: z.string().trim().min(1).max(64).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  requirements: jobCatalogOccupationRequirementsSchema.optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogOccupationPatchBody = z.infer<
  typeof adminJobCatalogOccupationPatchSchema
>;

/** @deprecated Legacy flat create — maps to sector header or occupation row. */
export const adminJobCatalogCreateSchema = z.object({
  sectorCode: z.string().trim().min(1).max(64),
  occupationCode: z.string().trim().min(1).max(64).nullable().optional(),
  title: z.string().trim().min(1).max(200),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogCreateBody = z.infer<
  typeof adminJobCatalogCreateSchema
>;

/** @deprecated Legacy flat patch. */
export const adminJobCatalogPatchSchema = z.object({
  sectorCode: z.string().trim().min(1).max(64).optional(),
  occupationCode: z.string().trim().min(1).max(64).nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export type AdminJobCatalogPatchBody = z.infer<
  typeof adminJobCatalogPatchSchema
>;

export const adminJobCatalogItemSchema = adminJobCatalogOccupationSchema.extend({
  sectorCode: z.string(),
});

export const adminJobCatalogListDataSchema = adminJobCatalogTreeDataSchema;

export const adminJobCatalogListResponseSchema = adminJobCatalogTreeResponseSchema;

export const adminJobCatalogSectorResponseSchema = successEnvelopeSchema(
  adminJobCatalogSectorSchema,
);

export const adminJobCatalogOccupationResponseSchema = successEnvelopeSchema(
  adminJobCatalogOccupationSchema,
);

export const adminJobCatalogItemResponseSchema = successEnvelopeSchema(
  z.union([adminJobCatalogSectorSchema, adminJobCatalogOccupationSchema]),
);

export const adminJobCatalogDeleteDataSchema = z.object({
  deleted: z.literal(true),
});

export const adminJobCatalogDeleteResponseSchema = successEnvelopeSchema(
  adminJobCatalogDeleteDataSchema,
);
