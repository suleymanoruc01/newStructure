import {
  tokenAllocateBodySchema,
  tokenAllocateResponseSchema,
  tokenBalanceResponseSchema,
  tokenLedgerResponseSchema,
  tokenPackagesListResponseSchema,
  tokenRequestApproveBodySchema,
  tokenRequestCreateBodySchema,
  tokenRequestListResponseSchema,
  tokenRequestResponseSchema,
  tokenTopUpBodySchema,
  tokenTopUpResponseSchema,
  type TokenAllocateBody,
  type TokenRequestApproveBody,
  type TokenRequestCreateBody,
  type TokenTopUpBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchTokenBalance(accessToken: string) {
  return apiRequest('/employers/me/tokens', tokenBalanceResponseSchema, {
    accessToken,
  });
}

export async function fetchTokenPackages(accessToken: string) {
  return apiRequest(
    '/employers/me/tokens/packages',
    tokenPackagesListResponseSchema,
    { accessToken },
  );
}

export async function fetchTokenLedger(accessToken: string) {
  return apiRequest('/employers/me/tokens/ledger', tokenLedgerResponseSchema, {
    accessToken,
  });
}

export async function topUpTokens(
  body: TokenTopUpBody,
  accessToken: string,
  idempotencyKey: string,
) {
  tokenTopUpBodySchema.parse(body);
  return apiRequest('/employers/me/tokens/top-ups', tokenTopUpResponseSchema, {
    method: 'POST',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function allocateTokens(
  body: TokenAllocateBody,
  accessToken: string,
) {
  tokenAllocateBodySchema.parse(body);
  return apiRequest(
    '/employers/me/tokens/allocate',
    tokenAllocateResponseSchema,
    { method: 'POST', body, accessToken },
  );
}

export async function fetchTokenRequests(accessToken: string) {
  return apiRequest(
    '/employers/me/tokens/requests',
    tokenRequestListResponseSchema,
    { accessToken },
  );
}

export async function createTokenRequest(
  body: TokenRequestCreateBody,
  accessToken: string,
) {
  tokenRequestCreateBodySchema.parse(body);
  return apiRequest(
    '/employers/me/tokens/requests',
    tokenRequestResponseSchema,
    { method: 'POST', body, accessToken },
  );
}

export async function approveTokenRequest(
  id: string,
  body: TokenRequestApproveBody,
  accessToken: string,
) {
  tokenRequestApproveBodySchema.parse(body);
  return apiRequest(
    `/employers/me/tokens/requests/${id}/approve`,
    tokenRequestResponseSchema,
    { method: 'POST', body, accessToken },
  );
}

export async function rejectTokenRequest(id: string, accessToken: string) {
  return apiRequest(
    `/employers/me/tokens/requests/${id}/reject`,
    tokenRequestResponseSchema,
    { method: 'POST', body: {}, accessToken },
  );
}
