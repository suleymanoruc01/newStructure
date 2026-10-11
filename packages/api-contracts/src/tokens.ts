import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const tokenBalanceSchema = z.object({
  balance: z.number().int().nonnegative(),
  held: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
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

export const tokenTopUpBodySchema = z.object({
  amount: z.number().int().min(1).max(100_000),
  /** Required when `TOKEN_TOPUP_LEDGER_CREDIT` is false (sandbox PSP). */
  paymentOutcome: tokenTopUpPaymentOutcomeSchema.optional(),
});

export type TokenTopUpBody = z.infer<typeof tokenTopUpBodySchema>;

export const tokenTopUpDataSchema = z.object({
  balance: z.number().int().nonnegative(),
  credited: z.number().int().positive(),
});

export const tokenTopUpResponseSchema =
  successEnvelopeSchema(tokenTopUpDataSchema);
