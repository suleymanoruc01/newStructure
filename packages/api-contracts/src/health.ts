import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const healthLiveDataSchema = z.object({
  status: z.literal('ok'),
});

export const healthLiveResponseSchema =
  successEnvelopeSchema(healthLiveDataSchema);

export const healthReadyDataSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['up', 'down']),
});

export const healthReadyResponseSchema =
  successEnvelopeSchema(healthReadyDataSchema);
