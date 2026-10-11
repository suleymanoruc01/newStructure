import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const workerGenderSchema = z.enum([
  'female',
  'male',
  'other',
  'unspecified',
]);

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1439),
  crossesMidnight: z.boolean().optional(),
});

export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;

export const workerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  birthDate: z.string().date().nullable().optional(),
  gender: workerGenderSchema.nullable().optional(),
  homeLatitude: z.number().nullable().optional(),
  homeLongitude: z.number().nullable().optional(),
  nightShiftAvailable: z.boolean(),
  sectorCodes: z.array(z.string()),
  occupationCodes: z.array(z.string()),
  profileComplete: z.boolean(),
  completionMissing: z.array(z.string()),
});

export type WorkerProfile = z.infer<typeof workerProfileSchema>;

export const workerProfilePatchSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  birthDate: z.string().date().optional(),
  gender: workerGenderSchema.optional(),
  homeLatitude: z.number().min(-90).max(90).optional(),
  homeLongitude: z.number().min(-180).max(180).optional(),
  nightShiftAvailable: z.boolean().optional(),
  sectorCodes: z.array(z.string().min(1).max(64)).optional(),
  occupationCodes: z.array(z.string().min(1).max(64)).optional(),
});

export type WorkerProfilePatch = z.infer<typeof workerProfilePatchSchema>;

export const workerProfileResponseSchema =
  successEnvelopeSchema(workerProfileSchema);

export const workerAvailabilityPutSchema = z.object({
  windows: z.array(availabilityWindowSchema).min(1),
});

export type WorkerAvailabilityPut = z.infer<typeof workerAvailabilityPutSchema>;

export const workerAvailabilityDataSchema = z.object({
  windows: z.array(availabilityWindowSchema),
});

export const workerAvailabilityResponseSchema = successEnvelopeSchema(
  workerAvailabilityDataSchema,
);

export const workerSetupStatusSchema = z.object({
  complete: z.boolean(),
  missing: z.array(z.string()),
});

export const workerSetupStatusResponseSchema = successEnvelopeSchema(
  workerSetupStatusSchema,
);
