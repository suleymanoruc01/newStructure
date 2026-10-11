import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const favoriteTargetTypeSchema = z.enum(['worker', 'employer']);

export type FavoriteTargetType = z.infer<typeof favoriteTargetTypeSchema>;

export const favoriteCreateSchema = z.object({
  type: favoriteTargetTypeSchema,
  id: z.string().uuid(),
});

export type FavoriteCreateBody = z.infer<typeof favoriteCreateSchema>;

export const favoriteItemSchema = z.object({
  id: z.string().uuid(),
  type: favoriteTargetTypeSchema,
  targetId: z.string().uuid(),
  mutual: z.boolean(),
  createdAt: z.string().datetime(),
});

export type FavoriteItem = z.infer<typeof favoriteItemSchema>;

export const favoritesListDataSchema = z.object({
  items: z.array(favoriteItemSchema),
});

export const favoritesListResponseSchema =
  successEnvelopeSchema(favoritesListDataSchema);

export const favoriteCreateDataSchema = favoriteItemSchema;

export const favoriteCreateResponseSchema = successEnvelopeSchema(
  favoriteCreateDataSchema,
);
