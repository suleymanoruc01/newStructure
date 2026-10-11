import {
  branchCreateBodySchema,
  branchListResponseSchema,
  branchResponseSchema,
  managerJoinBodySchema,
  managerJoinResponseSchema,
  type BranchCreateBody,
  type ManagerJoinBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';
import type { ManagerJoinData } from './manager-api-types';

export async function listBranches(accessToken: string) {
  return apiRequest('/branches', branchListResponseSchema, {
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
