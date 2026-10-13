import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const ianaTimeZoneSchema = z.string().min(1).max(64).refine((value) => {
  try {
    new Intl.DateTimeFormat('tr-TR', { timeZone: value });
    return true;
  } catch {
    return false;
  }
});

export const platformRemoteConfigDataSchema = z.object({
  maintenanceMode: z.boolean(),
  minMobileIosVersion: z.string().nullable(),
  minMobileAndroidVersion: z.string().nullable(),
  geofenceRadiusM: z.number().int().positive(),
  geofenceSoftRadiusM: z.number().int().positive(),
  geofenceMaxAccuracyM: z.number().int().positive(),
  checkinEarlyMinutes: z.number().int().nonnegative(),
  checkinLateMinutes: z.number().int().nonnegative(),
  timeZone: ianaTimeZoneSchema,
  // Adapty is the store billing path. Remote config omits these while it is not activated.
  adaptyEnabled: z.boolean().default(false),
  adaptyPublicSdkKey: z.string().default(''),
  adaptyPlacementId: z.string().default(''),
  appleStoreConnected: z.boolean().default(false),
  googleStoreConnected: z.boolean().default(false),
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
