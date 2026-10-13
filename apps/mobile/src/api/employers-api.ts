import {
  employerCalendarResponseSchema,
  employerCreateBodySchema,
  employerCreateResponseSchema,
  employerListResponseSchema,
  employerPatchBodySchema,
  employerResponseSchema,
  employerSetupStatusResponseSchema,
  managerAssignmentListResponseSchema,
  managerAssignmentPatchBodySchema,
  managerAssignmentResponseSchema,
  managerInvitePatchBodySchema,
  workplaceManagerInviteResponseSchema,
  type EmployerCreateBody,
  type EmployerPatchBody,
  type ManagerAssignmentPatchBody,
  type ManagerInvitePatchBody,
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

export async function listWorkplaces(accessToken: string) {
  return apiRequest('/employers', employerListResponseSchema, { accessToken });
}

export async function listWorkplaceManagers(accessToken: string) {
  return apiRequest(
    '/employers/me/managers',
    managerAssignmentListResponseSchema,
    { accessToken },
  );
}

export async function patchWorkplaceManager(
  userId: string,
  body: ManagerAssignmentPatchBody,
  accessToken: string,
) {
  managerAssignmentPatchBodySchema.parse(body);
  return apiRequest(
    `/employers/me/managers/${userId}`,
    managerAssignmentResponseSchema,
    { method: 'PATCH', body, accessToken },
  );
}

export async function patchWorkplaceManagerInvite(
  body: ManagerInvitePatchBody,
  accessToken: string,
) {
  managerInvitePatchBodySchema.parse(body);
  return apiRequest(
    '/employers/me/manager-invite',
    workplaceManagerInviteResponseSchema,
    { method: 'PATCH', body, accessToken },
  );
}

export async function fetchWorkplaceManagerInvite(accessToken: string) {
  return apiRequest(
    '/employers/me/manager-invite',
    workplaceManagerInviteResponseSchema,
    { accessToken },
  );
}

export async function fetchEmployerSetupStatus(accessToken: string) {
  return apiRequest(
    '/employers/me/setup-status',
    employerSetupStatusResponseSchema,
    { accessToken },
  );
}

export async function fetchEmployerCalendar(
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
    `/employers/me/calendar${query ? `?${query}` : ''}`,
    employerCalendarResponseSchema,
    { accessToken },
  );
}
