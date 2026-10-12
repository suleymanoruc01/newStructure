import {
  workerAvailabilityPutSchema,
  workerAvailabilityResponseSchema,
  workerCalendarResponseSchema,
  workerProfilePatchSchema,
  workerProfileResponseSchema,
  workerSetupStatusResponseSchema,
  type WorkerAvailabilityPut,
  type WorkerProfilePatch,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchWorkerProfile(accessToken: string) {
  return apiRequest('/workers/me', workerProfileResponseSchema, {
    accessToken,
  });
}

export async function patchWorkerProfile(
  body: WorkerProfilePatch,
  accessToken: string,
) {
  workerProfilePatchSchema.parse(body);
  return apiRequest('/workers/me', workerProfileResponseSchema, {
    method: 'PATCH',
    body,
    accessToken,
  });
}

export async function fetchWorkerAvailability(accessToken: string) {
  return apiRequest('/workers/me/availability', workerAvailabilityResponseSchema, {
    accessToken,
  });
}

export async function putWorkerAvailability(
  body: WorkerAvailabilityPut,
  accessToken: string,
) {
  workerAvailabilityPutSchema.parse(body);
  return apiRequest('/workers/me/availability', workerAvailabilityResponseSchema, {
    method: 'PUT',
    body,
    accessToken,
  });
}

export async function fetchWorkerSetupStatus(accessToken: string) {
  return apiRequest(
    '/workers/me/setup-status',
    workerSetupStatusResponseSchema,
    { accessToken },
  );
}

export async function fetchWorkerCalendar(
  accessToken: string,
  range?: { from?: string; to?: string },
) {
  const params = new URLSearchParams();
  if (range?.from) {
    params.set('from', range.from);
  }
  if (range?.to) {
    params.set('to', range.to);
  }
  const query = params.toString();
  return apiRequest(
    `/workers/me/calendar${query ? `?${query}` : ''}`,
    workerCalendarResponseSchema,
    { accessToken },
  );
}
