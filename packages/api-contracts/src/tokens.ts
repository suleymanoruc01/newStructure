import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const tokenPoolSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string(),
  balance: z.number().int().nonnegative(),
  held: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
});

export const tokenBalanceSchema = z.object({
  balance: z.number().int().nonnegative(),
  held: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  unallocated: z.number().int().nonnegative().optional(),
  workplace: z.number().int().nonnegative().optional(),
  branches: z.array(tokenPoolSchema).optional(),
});

export const tokenBalanceResponseSchema =
  successEnvelopeSchema(tokenBalanceSchema);

export const tokenLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  amount: z.number().int(),
  balanceAfter: z.number().int(),
  refType: z.string().nullable().optional(),
  refId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const tokenLedgerDataSchema = z.object({
  items: z.array(tokenLedgerEntrySchema),
});

export const tokenLedgerResponseSchema =
  successEnvelopeSchema(tokenLedgerDataSchema);

export const tokenTopUpPaymentOutcomeSchema = z.enum([
  'approve',
  'decline',
  'cancel',
]);

export const tokenTopUpBodySchema = z
  .object({
    packageId: z.string().uuid().optional(),
    amount: z.number().int().min(1).max(100_000).optional(),
    /** Sandbox only — ignored when Adapty is on in xadmin. */
    paymentOutcome: tokenTopUpPaymentOutcomeSchema.optional(),
    adaptyTransactionId: z.string().trim().min(4).max(200).optional(),
  })
  .refine((body) => body.packageId != null || body.amount != null, {
    message: 'packageId veya amount gerekli',
  });

export type TokenTopUpBody = z.infer<typeof tokenTopUpBodySchema>;

export const tokenTopUpDataSchema = z.object({
  balance: z.number().int().nonnegative(),
  credited: z.number().int().positive(),
  packageId: z.string().uuid().nullable().optional(),
  bonusCredited: z.number().int().nonnegative().optional(),
});

export const tokenTopUpResponseSchema =
  successEnvelopeSchema(tokenTopUpDataSchema);

export const tokenAllocateBodySchema = z.object({
  amount: z.number().int().min(1).max(100_000),
  target: z.enum(['workplace', 'branch']),
  branchId: z.string().uuid().optional(),
});

export type TokenAllocateBody = z.infer<typeof tokenAllocateBodySchema>;

export const tokenAllocateDataSchema = z.object({
  unallocated: z.number().int().nonnegative(),
  workplace: z.number().int().nonnegative(),
  branchId: z.string().uuid().nullable().optional(),
  branchBalance: z.number().int().nonnegative().optional(),
});

export const tokenAllocateResponseSchema = successEnvelopeSchema(
  tokenAllocateDataSchema,
);

export const tokenRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
]);

export const tokenRequestCreateBodySchema = z.object({
  amount: z.number().int().min(1).max(100_000).optional(),
  branchId: z.string().uuid().optional(),
  note: z.string().trim().max(500).optional(),
});

export type TokenRequestCreateBody = z.infer<
  typeof tokenRequestCreateBodySchema
>;

export const tokenRequestApproveBodySchema = z.object({
  amount: z.number().int().min(1).max(100_000).optional(),
});

export type TokenRequestApproveBody = z.infer<
  typeof tokenRequestApproveBodySchema
>;

export const tokenRequestSchema = z.object({
  id: z.string().uuid(),
  requesterUserId: z.string().uuid(),
  employerId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  amount: z.number().int().nullable().optional(),
  status: tokenRequestStatusSchema,
  note: z.string().nullable().optional(),
  resolvedAmount: z.number().int().nullable().optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().optional(),
});

export const tokenRequestListDataSchema = z.object({
  items: z.array(tokenRequestSchema),
});

export const tokenRequestListResponseSchema = successEnvelopeSchema(
  tokenRequestListDataSchema,
);

export const tokenRequestResponseSchema =
  successEnvelopeSchema(tokenRequestSchema);
