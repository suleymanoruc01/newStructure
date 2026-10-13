import { z } from 'zod';

import { managerPermissionSchema, meUserSchema } from './auth/schemas.js';
import { successEnvelopeSchema } from './envelope.js';
import { shiftSchema } from './shifts.js';

export const employerVerificationStatusSchema = z.enum([
  'pending',
  'verified',
  'rejected',
  'bypass',
]);

const workplaceLocationFields = {
  addressLine1: z.string().min(2).max(240).optional(),
  city: z.string().min(2).max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
};

export const employerCreateBodySchema = z
  .object({
    legalName: z.string().min(2).max(200),
    taxId: z.string().min(10).max(11),
    tradingName: z.string().min(2).max(200).optional(),
    industryCodes: z.array(z.string().min(1).max(64)).optional(),
    ...workplaceLocationFields,
  })
  .refine(
    (body) =>
      (body.latitude === undefined) === (body.longitude === undefined),
    { message: 'latitude ve longitude birlikte gönderilmeli' },
  );

export type EmployerCreateBody = z.infer<typeof employerCreateBodySchema>;

export const employerSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string(),
  tradingName: z.string().nullable().optional(),
  taxId: z.string(),
  publicCode: z.string().length(8),
  industryCodes: z.array(z.string()),
  addressLine1: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  verificationStatus: employerVerificationStatusSchema,
  managerInviteCode: z.string().optional(),
});

export type Employer = z.infer<typeof employerSchema>;

export const employerResponseSchema = successEnvelopeSchema(employerSchema);

export const employerPatchBodySchema = z
  .object({
    legalName: z.string().min(2).max(200).optional(),
    tradingName: z.string().min(2).max(200).optional(),
    industryCodes: z.array(z.string().min(1).max(64)).optional(),
    ...workplaceLocationFields,
  })
  .refine(
    (body) =>
      (body.latitude === undefined) === (body.longitude === undefined),
    { message: 'latitude ve longitude birlikte gönderilmeli' },
  );

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

export const employerListDataSchema = z.object({
  items: z.array(employerSchema),
});

export const employerListResponseSchema = successEnvelopeSchema(
  employerListDataSchema,
);

export const workplaceManagerInviteSchema = z.object({
  joinCode: z.string(),
  expiresAt: z.string().datetime(),
  permissions: z.array(managerPermissionSchema).optional(),
});

export const managerInvitePatchBodySchema = z
  .object({
    permissions: z.array(managerPermissionSchema).optional(),
    rotate: z.boolean().optional(),
  })
  .refine((row) => row.permissions != null || row.rotate === true, {
    message: 'permissions veya rotate gerekli',
  });

export type ManagerInvitePatchBody = z.infer<
  typeof managerInvitePatchBodySchema
>;

export const managerAssignmentSchema = z.object({
  userId: z.string().uuid(),
  status: z.string(),
  permissions: z.array(managerPermissionSchema),
  phoneE164: z.string().optional(),
  branchId: z.string().uuid().nullable().optional(),
  scope: z.enum(['workplace', 'branch']),
});

export const managerAssignmentListDataSchema = z.object({
  items: z.array(managerAssignmentSchema),
  inviteCode: z.string().optional(),
  invitePermissions: z.array(managerPermissionSchema).optional(),
});

export const managerAssignmentListResponseSchema = successEnvelopeSchema(
  managerAssignmentListDataSchema,
);

export const managerAssignmentPatchBodySchema = z.object({
  permissions: z.array(managerPermissionSchema).optional(),
  status: z.enum(['active', 'revoked']).optional(),
});

export type ManagerAssignmentPatchBody = z.infer<
  typeof managerAssignmentPatchBodySchema
>;

export const managerAssignmentResponseSchema = successEnvelopeSchema(
  managerAssignmentSchema,
);

export const workplaceManagerInviteResponseSchema = successEnvelopeSchema(
  workplaceManagerInviteSchema,
);
