import {
  ratingCreateResponseSchema,
  ratingCreateSchema,
  ratingsPendingResponseSchema,
  type RatingCreateBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function listPendingRatings(accessToken: string) {
  return apiRequest('/ratings/pending', ratingsPendingResponseSchema, {
    accessToken,
  });
}

export async function submitRating(accessToken: string, body: RatingCreateBody) {
  ratingCreateSchema.parse(body);
  return apiRequest('/ratings', ratingCreateResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}
