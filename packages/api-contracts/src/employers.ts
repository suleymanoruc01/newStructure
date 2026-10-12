import { z } from 'zod';

import { meUserSchema } from './auth/schemas.js';
import { successEnvelopeSchema } from './envelope.js';
import { shiftSchema } from './shifts.js';

export const employerVerificationStatusSchema = z.enum([
  'pending',
  'verified',
  'rejected',
  'bypass',
]);

export const employerCreateBodySchema = z.object({
  legalName: z.string().min(2).max(200),
  taxId: z.string().min(10).max(11),
  tradingName: z.string().min(2).max(200).optional(),
  industryCodes: z.array(z.string().min(1).max(64)).optional(),
});

export type EmployerCreateBody = z.infer<typeof employerCreateBodySchema>;

export const employerSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string(),
  tradingName: z.string().nullable().optional(),
  taxId: z.string(),
  industryCodes: z.array(z.string()),
  verificationStatus: employerVerificationStatusSchema,
});

export type Employer = z.infer<typeof employerSchema>;

export const employerResponseSchema = successEnvelopeSchema(employerSchema);

export const employerPatchBodySchema = z.object({
  legalName: z.string().min(2).max(200).optional(),
  tradingName: z.string().min(2).max(200).optional(),
  industryCodes: z.array(z.string().min(1).max(64)).optional(),
});

export type EmployerPatchBody = z.infer<typeof employerPatchBodySchema>;

export const employerSetupStatusSchema = z.object({
  complete: z.boolean(),
  missing: z.array(z.string()),
});

export const employerSetupStatusResponseSchema = successEnvelopeSchema(
  employerSetupStatusSchema,
);

export const employerCreateDataSchema = z.object({
  employer: employerSchema,
  accessToken: z.string(),
  accessExpiresAt: z.string(),
  refreshToken: z.string(),
  user: meUserSchema,
});

export const employerCreateResponseSchema = successEnvelopeSchema(
  employerCreateDataSchema,
);

export const employerCalendarDataSchema = z.object({
  items: z.array(shiftSchema),
});

export type EmployerCalendarData = z.infer<typeof employerCalendarDataSchema>;

export const employerCalendarResponseSchema = successEnvelopeSchema(
  employerCalendarDataSchema,
);
