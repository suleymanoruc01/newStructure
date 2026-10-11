import {
  tokenBalanceResponseSchema,
  tokenLedgerResponseSchema,
  tokenTopUpBodySchema,
  tokenTopUpResponseSchema,
  type TokenTopUpBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchTokenBalance(accessToken: string) {
  return apiRequest('/employers/me/tokens', tokenBalanceResponseSchema, {
    accessToken,
  });
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
