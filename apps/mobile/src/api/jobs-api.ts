import {
  branchJobCreateBodySchema,
  jobCatalogResponseSchema,
  jobCreateBodySchema,
  jobFeedResponseSchema,
  jobListResponseSchema,
  jobPatchBodySchema,
  jobResponseSchema,
  type BranchJobCreateBody,
  type JobCreateBody,
  type JobPatchBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchJobFeed(
  accessToken: string,
  options: {
    limit?: number;
    cursor?: string | null;
    sectorCode?: string;
    occupationCode?: string;
    onlyFavorites?: boolean;
    onlyInstantApproval?: boolean;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }
  if (options.sectorCode) {
    params.set('sectorCode', options.sectorCode);
  }
  if (options.occupationCode) {
    params.set('occupationCode', options.occupationCode);
  }
  if (options.onlyFavorites) {
    params.set('onlyFavorites', '1');
  }
  if (options.onlyInstantApproval) {
    params.set('onlyInstantApproval', '1');
  }
  const qs = params.toString();
  return apiRequest(
    `/jobs/feed${qs ? `?${qs}` : ''}`,
    jobFeedResponseSchema,
    { accessToken },
  );
}

export async function fetchJobCatalog() {
  return apiRequest('/job-catalog', jobCatalogResponseSchema);
}

export async function fetchJobDetail(jobId: string, accessToken: string) {
  return apiRequest(`/jobs/${jobId}`, jobResponseSchema, {
    accessToken,
  });
}

export async function listEmployerJobs(accessToken: string) {
  return apiRequest('/jobs?employer=me', jobListResponseSchema, {
    accessToken,
  });
}

export async function createJob(body: JobCreateBody, accessToken: string) {
  jobCreateBodySchema.parse(body);
  return apiRequest('/jobs', jobResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function patchEmployerJob(
  jobId: string,
  body: JobPatchBody,
  accessToken: string,
  idempotencyKey?: string,
) {
  jobPatchBodySchema.parse(body);
  return apiRequest(`/jobs/${jobId}`, jobResponseSchema, {
    method: 'PATCH',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createBranchJob(
  branchId: string,
  body: BranchJobCreateBody,
  accessToken: string,
) {
  branchJobCreateBodySchema.parse(body);
  return apiRequest(`/branches/${branchId}/jobs`, jobResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}
