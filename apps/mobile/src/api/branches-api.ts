import {
  branchCreateBodySchema,
  branchDetailResponseSchema,
  branchListResponseSchema,
  branchPatchBodySchema,
  branchResponseSchema,
  managerAssignmentListResponseSchema,
  managerAssignmentPatchBodySchema,
  managerAssignmentResponseSchema,
  managerInvitePatchBodySchema,
  managerJoinBodySchema,
  managerJoinResponseSchema,
  workplaceManagerInviteResponseSchema,
  type BranchCreateBody,
  type BranchPatchBody,
  type ManagerAssignmentPatchBody,
  type ManagerInvitePatchBody,
  type ManagerJoinBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';
import type { ManagerJoinData } from './manager-api-types';

export async function listBranches(accessToken: string) {
  return apiRequest('/branches', branchListResponseSchema, {
    accessToken,
  });
}

export async function getBranch(id: string, accessToken: string) {
  return apiRequest(`/branches/${id}`, branchDetailResponseSchema, {
    accessToken,
  });
}

export async function patchBranch(
  id: string,
  body: BranchPatchBody,
  accessToken: string,
) {
  branchPatchBodySchema.parse(body);
  return apiRequest(`/branches/${id}`, branchResponseSchema, {
    method: 'PATCH',
    body,
    accessToken,
  });
}

export async function createBranch(
  body: BranchCreateBody,
  accessToken: string,
) {
  branchCreateBodySchema.parse(body);
  return apiRequest('/branches', branchResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function listBranchManagers(
  branchId: string,
  accessToken: string,
) {
  return apiRequest(
    `/branches/${branchId}/managers`,
    managerAssignmentListResponseSchema,
    { accessToken },
  );
}

export async function patchBranchManager(
  branchId: string,
  userId: string,
  body: ManagerAssignmentPatchBody,
  accessToken: string,
) {
  managerAssignmentPatchBodySchema.parse(body);
  return apiRequest(
    `/branches/${branchId}/managers/${userId}`,
    managerAssignmentResponseSchema,
    { method: 'PATCH', body, accessToken },
  );
}

export async function patchBranchManagerInvite(
  branchId: string,
  body: ManagerInvitePatchBody,
  accessToken: string,
) {
  managerInvitePatchBodySchema.parse(body);
  return apiRequest(
    `/branches/${branchId}/manager-invite`,
    workplaceManagerInviteResponseSchema,
    { method: 'PATCH', body, accessToken },
  );
}

export async function managerJoin(
  body: ManagerJoinBody,
  accessToken: string,
): Promise<ManagerJoinData> {
  managerJoinBodySchema.parse(body);
  return apiRequest('/branches/manager-join', managerJoinResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}
