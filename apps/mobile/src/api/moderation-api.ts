import {
  moderationReportCreateSchema,
  moderationReportResponseSchema,
  type ModerationReportCreate,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function createModerationReport(
  accessToken: string,
  body: ModerationReportCreate,
) {
  const parsed = moderationReportCreateSchema.parse(body);
  return apiRequest('/moderation/reports', moderationReportResponseSchema, {
    method: 'POST',
    accessToken,
    body: parsed,
  });
}
