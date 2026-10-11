import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const devopsAppSchema = z.enum([
  'api',
  'admin',
  'marketing',
  'mobile',
]);

export const devopsErrorIngestSchema = z.object({
  app: devopsAppSchema,
  release: z.string().max(120).optional(),
  platform: z.string().max(64).optional(),
  message: z.string().min(1).max(2000),
  stack: z.string().max(16_000).optional(),
  fingerprint: z.string().max(128).optional(),
  requestId: z.string().max(128).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export type DevopsErrorIngestBody = z.infer<typeof devopsErrorIngestSchema>;

export const devopsErrorGroupSchema = z.object({
  fingerprint: z.string(),
  app: devopsAppSchema,
  message: z.string(),
  status: z.enum(['open', 'resolved', 'ignored']),
  release: z.string().nullable().optional(),
  eventCount: z.number().int(),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
});

export const devopsErrorsListQuerySchema = z.object({
  app: devopsAppSchema.optional(),
  status: z.enum(['open', 'resolved', 'ignored']).optional(),
  release: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const devopsErrorsListDataSchema = z.object({
  items: z.array(devopsErrorGroupSchema),
});

export const devopsErrorsListResponseSchema = successEnvelopeSchema(
  devopsErrorsListDataSchema,
);

export const devopsErrorDetailDataSchema = devopsErrorGroupSchema.extend({
  recentEvents: z.array(
    z.object({
      id: z.string().uuid(),
      message: z.string(),
      requestId: z.string().nullable().optional(),
      createdAt: z.string().datetime(),
    }),
  ),
});

export const devopsErrorDetailResponseSchema = successEnvelopeSchema(
  devopsErrorDetailDataSchema,
);

export const devopsErrorPatchSchema = z.object({
  status: z.enum(['resolved', 'ignored']),
});

export type DevopsErrorPatchBody = z.infer<typeof devopsErrorPatchSchema>;

export const devopsReleaseRegisterSchema = z.object({
  app: devopsAppSchema,
  version: z.string().min(1).max(64),
  gitSha: z.string().min(7).max(64),
  environment: z.enum(['local', 'staging', 'production']),
  builtAt: z.string().datetime(),
});

export type DevopsReleaseRegisterBody = z.infer<
  typeof devopsReleaseRegisterSchema
>;

export const devopsReleaseSchema = z.object({
  id: z.string().uuid(),
  app: devopsAppSchema,
  version: z.string(),
  gitSha: z.string(),
  environment: z.string(),
  builtAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const devopsReleasesListDataSchema = z.object({
  items: z.array(devopsReleaseSchema),
});

export const devopsReleasesListResponseSchema = successEnvelopeSchema(
  devopsReleasesListDataSchema,
);

export const devopsServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(['up', 'degraded', 'down']),
  detail: z.string().optional(),
});

export const devopsServicesDataSchema = z.object({
  services: z.array(devopsServiceStatusSchema),
  outboxPending: z.number().int(),
  outboxFailed: z.number().int(),
});

export const devopsServicesResponseSchema = successEnvelopeSchema(
  devopsServicesDataSchema,
);

export const devopsClientsDataSchema = z.object({
  items: z.array(
    z.object({
      app: devopsAppSchema,
      latestRelease: z.string().nullable(),
      minVersion: z.string().nullable(),
      openErrorGroups: z.number().int(),
    }),
  ),
});

export const devopsClientsResponseSchema = successEnvelopeSchema(
  devopsClientsDataSchema,
);

export const devopsOverviewDataSchema = z.object({
  openErrorGroups: z.number().int(),
  unhealthyServices: z.number().int(),
  latestReleases: z.array(devopsReleaseSchema),
});

export const devopsOverviewResponseSchema = successEnvelopeSchema(
  devopsOverviewDataSchema,
);
