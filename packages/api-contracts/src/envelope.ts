import { z } from 'zod';

export const metaSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  pagination: z
    .object({
      nextCursor: z.string().nullable().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().optional(),
      total: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export type Meta = z.infer<typeof metaSchema>;

export const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        path: z.string().optional(),
        code: z.string(),
        jobId: z.string().uuid().optional(),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
      }),
    )
    .optional(),
});

export type ApiErrorBody = z.infer<typeof errorBodySchema>;

export const errorEnvelopeSchema = z.object({
  error: errorBodySchema,
  meta: metaSchema,
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export function successEnvelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({
    data,
    meta: metaSchema,
  });
}

export type SuccessEnvelope<T> = {
  data: T;
  meta: Meta;
};
