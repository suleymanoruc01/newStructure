import {
  favoriteCreateResponseSchema,
  favoriteCreateSchema,
  favoritesListResponseSchema,
  type FavoriteCreateBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function listFavorites(accessToken: string) {
  return apiRequest('/favorites', favoritesListResponseSchema, {
    accessToken,
  });
}

export async function createFavorite(
  accessToken: string,
  body: FavoriteCreateBody,
  idempotencyKey?: string,
) {
  favoriteCreateSchema.parse(body);
  return apiRequest('/favorites', favoriteCreateResponseSchema, {
    method: 'POST',
    body,
    accessToken,
    idempotencyKey,
  });
}
