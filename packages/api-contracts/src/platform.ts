import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const platformRemoteConfigDataSchema = z.object({
  maintenanceMode: z.boolean(),
  minMobileIosVersion: z.string().nullable(),
  minMobileAndroidVersion: z.string().nullable(),
  geofenceRadiusM: z.number().int().positive(),
  geofenceSoftRadiusM: z.number().int().positive(),
});

export const platformRemoteConfigResponseSchema = successEnvelopeSchema(
  platformRemoteConfigDataSchema,
);

export const realtimeTicketCreateDataSchema = z.object({
  ticket: z.string().min(16).max(128),
  expiresAt: z.string().datetime(),
});

export const realtimeTicketCreateResponseSchema = successEnvelopeSchema(
  realtimeTicketCreateDataSchema,
);
