import type { ApiErrorBody } from '@parton/api-contracts';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody['details'];

  constructor(
    message: string,
    status: number,
    code: string,
    details?: ApiErrorBody['details'],
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function refreshCredentialRejected(err: unknown): boolean {
  return (
    err instanceof ApiClientError &&
    (err.status === 401 ||
      err.code === 'SESSION_EXPIRED' ||
      err.code === 'UNAUTHORIZED')
  );
}
