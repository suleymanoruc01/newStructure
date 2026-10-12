import {
  employerCreateBodySchema,
  employerCreateResponseSchema,
  employerPatchBodySchema,
  employerResponseSchema,
  employerSetupStatusResponseSchema,
  type EmployerCreateBody,
  type EmployerPatchBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';
import type { EmployerCreateData } from './employers-api-types';

export async function createEmployer(
  body: EmployerCreateBody,
  accessToken: string,
): Promise<EmployerCreateData> {
  employerCreateBodySchema.parse(body);
  return apiRequest('/employers', employerCreateResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function patchEmployerMe(
  body: EmployerPatchBody,
  accessToken: string,
) {
  employerPatchBodySchema.parse(body);
  return apiRequest('/employers/me', employerResponseSchema, {
    method: 'PATCH',
    body,
    accessToken,
  });
}

export async function fetchEmployerMe(accessToken: string) {
  return apiRequest('/employers/me', employerResponseSchema, { accessToken });
}

export async function fetchEmployerSetupStatus(accessToken: string) {
  return apiRequest(
    '/employers/me/setup-status',
    employerSetupStatusResponseSchema,
    { accessToken },
  );
}
