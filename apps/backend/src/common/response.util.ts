import type { Meta, SuccessEnvelope } from '@parton/api-contracts';

import { buildMeta } from './meta.util.js';

export function successResponse<T>(
  requestId: string,
  data: T,
): SuccessEnvelope<T> {
  const meta: Meta = buildMeta(requestId);
  return { data, meta };
}

export function successPaginatedResponse<T>(
  requestId: string,
  data: T,
  pagination: NonNullable<Meta['pagination']>,
): SuccessEnvelope<T> {
  const meta: Meta = {
    ...buildMeta(requestId),
    pagination,
  };
  return { data, meta };
}
