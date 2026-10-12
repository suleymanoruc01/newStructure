import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const tokenPackageSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  tokenCount: z.number().int().positive(),
  priceTry: z.number().int().nonnegative(),
  discountPercent: z.number().int().min(0).max(100),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export const tokenPackagePublicSchema = tokenPackageSchema.omit({ isActive: true });

export const tokenPackagesListDataSchema = z.object({
  items: z.array(tokenPackagePublicSchema),
});

export const tokenPackagesListResponseSchema = successEnvelopeSchema(
  tokenPackagesListDataSchema,
);

export const adminTokenPackagesListDataSchema = z.object({
  items: z.array(tokenPackageSchema),
});

export const adminTokenPackageCreateSchema = z.object({
  label: z.string().trim().min(1).max(120),
  tokenCount: z.number().int().positive(),
  priceTry: z.number().int().nonnegative(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type AdminTokenPackageCreateBody = z.infer<
  typeof adminTokenPackageCreateSchema
>;

export const adminTokenPackagePatchSchema = adminTokenPackageCreateSchema.partial();

export type AdminTokenPackagePatchBody = z.infer<
  typeof adminTokenPackagePatchSchema
>;
