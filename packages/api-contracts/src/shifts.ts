import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const shiftStatusSchema = z.enum([
  'scheduled',
  'awaiting_confirm',
  'can_come',
  'cannot_come',
  'released',
  'checked_in',
  'completed',
  'manual_confirmed',
]);

export type ShiftStatus = z.infer<typeof shiftStatusSchema>;

export const availabilityDecisionSchema = z.enum(['can_come', 'cannot_come']);

export type AvailabilityDecision = z.infer<typeof availabilityDecisionSchema>;

export const shiftConfirmWindowSchema = z.object({
  opensAt: z.string().datetime(),
  deadlineAt: z.string().datetime(),
  isOpen: z.boolean(),
});

export const shiftSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  jobId: z.string().uuid(),
  workerUserId: z.string().uuid(),
  employerId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  status: shiftStatusSchema,
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  jobTitle: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
  branchLatitude: z.number().optional(),
  branchLongitude: z.number().optional(),
  payAmountMinor: z.number().int().nonnegative().nullable().optional(),
  payCurrency: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  requiredDocumentTypes: z.array(z.string()).optional(),
  confirmWindow: shiftConfirmWindowSchema.optional(),
  availabilityDecision: availabilityDecisionSchema.nullable().optional(),
  availabilityRespondedAt: z.string().datetime().nullable().optional(),
  checkedInAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  workerDisplayName: z.string().nullable().optional(),
});

export type Shift = z.infer<typeof shiftSchema>;

export const shiftResponseSchema = successEnvelopeSchema(shiftSchema);

export const shiftListDataSchema = z.object({
  items: z.array(shiftSchema),
});

export const shiftListResponseSchema = successEnvelopeSchema(shiftListDataSchema);

export const availabilityConfirmBodySchema = z.object({
  decision: availabilityDecisionSchema,
  reason: z.string().max(500).optional(),
});

export type AvailabilityConfirmBody = z.infer<
  typeof availabilityConfirmBodySchema
>;

export const checkInLocationSourceSchema = z.enum(['gps', 'network']);

export const checkInBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().positive().max(5000),
  mockLocation: z.boolean().optional(),
  locationPermissionGranted: z.boolean(),
  /** agent-default: gap-wifi-location — network/Wi-Fi cannot pass geofence */
  locationSource: checkInLocationSourceSchema.optional(),
});

export type CheckInBody = z.infer<typeof checkInBodySchema>;

export const checkInResultSchema = z.object({
  shiftId: z.string().uuid(),
  status: shiftStatusSchema,
  checkedInAt: z.string().datetime(),
  distanceM: z.number(),
});

export const checkInResponseSchema = successEnvelopeSchema(checkInResultSchema);

export const checkOutBodySchema = z.object({
  notes: z.string().max(2000).optional(),
});

export type CheckOutBody = z.infer<typeof checkOutBodySchema>;

export const disputeCreateBodySchema = z.object({
  note: z.string().min(10).max(2000),
});

export type DisputeCreateBody = z.infer<typeof disputeCreateBodySchema>;

export const disputeSchema = z.object({
  id: z.string().uuid(),
  shiftId: z.string().uuid(),
  status: z.enum(['open', 'manual_confirmed', 'rejected']),
  note: z.string(),
  createdAt: z.string().datetime(),
});

export const disputeResponseSchema = successEnvelopeSchema(disputeSchema);

export const employerOpenDisputeItemSchema = z.object({
  disputeId: z.string().uuid(),
  shiftId: z.string().uuid(),
  status: z.enum(['open', 'manual_confirmed', 'rejected']),
  note: z.string(),
  createdAt: z.string().datetime(),
  jobTitle: z.string().nullable().optional(),
  workerDisplayName: z.string().nullable().optional(),
});

export const employerOpenDisputesDataSchema = z.object({
  items: z.array(employerOpenDisputeItemSchema),
});

export const employerOpenDisputesResponseSchema = successEnvelopeSchema(
  employerOpenDisputesDataSchema,
);

export const shiftIncidentTypeSchema = z.enum([
  'job_description_mismatch',
  'workplace_closed',
  'pay_dispute',
  'harassment',
  'emergency_help',
]);

export const shiftIncidentSeveritySchema = z.enum([
  'normal',
  'high',
  'critical',
]);

export const shiftIncidentCreateBodySchema = z.object({
  type: shiftIncidentTypeSchema,
  severity: shiftIncidentSeveritySchema,
  note: z.string().max(2000).optional(),
});

export type ShiftIncidentCreateBody = z.infer<
  typeof shiftIncidentCreateBodySchema
>;

export const shiftIncidentSchema = z.object({
  id: z.string().uuid(),
  shiftId: z.string().uuid(),
  type: shiftIncidentTypeSchema,
  severity: shiftIncidentSeveritySchema,
  note: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const shiftIncidentResponseSchema =
  successEnvelopeSchema(shiftIncidentSchema);
