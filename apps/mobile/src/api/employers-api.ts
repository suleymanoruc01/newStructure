import {
  employerCreateBodySchema,
  employerCreateResponseSchema,
  employerResponseSchema,
  employerSetupStatusResponseSchema,
  type EmployerCreateBody,
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
