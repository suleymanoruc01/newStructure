import {
  applicationApplyBodySchema,
  applicationApplyResponseSchema,
  applicationListResponseSchema,
  applicationResponseSchema,
  type ApplicationApplyBody,
  type ApplicationApplyResult,
  type ApplicationListItem,
  type Application,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function applyToJob(
  jobId: string,
  accessToken: string,
  body: ApplicationApplyBody = {},
  idempotencyKey?: string,
): Promise<ApplicationApplyResult> {
  applicationApplyBodySchema.parse(body);
  return apiRequest(`/jobs/${jobId}/applications`, applicationApplyResponseSchema, {
    method: 'POST',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function listMyApplications(
  accessToken: string,
  status?: string,
): Promise<{ items: ApplicationListItem[] }> {
  const params = new URLSearchParams({ mine: '1' });
  if (status) {
    params.set('status', status);
  }
  return apiRequest(
    `/applications?${params.toString()}`,
    applicationListResponseSchema,
    { accessToken },
  );
}

export async function listJobApplications(
  jobId: string,
  accessToken: string,
  status?: string,
): Promise<{ items: ApplicationListItem[] }> {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  const qs = params.toString();
  return apiRequest(
    `/jobs/${jobId}/applications${qs ? `?${qs}` : ''}`,
    applicationListResponseSchema,
    { accessToken },
  );
}

export async function acceptApplication(
  applicationId: string,
  accessToken: string,
  idempotencyKey?: string,
): Promise<Application> {
  return apiRequest(
    `/applications/${applicationId}/accept`,
    applicationResponseSchema,
    {
      method: 'POST',
      accessToken,
      idempotencyKey,
    },
  );
}
