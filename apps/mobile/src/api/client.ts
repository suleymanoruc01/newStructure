import {
  errorEnvelopeSchema,
  type SuccessEnvelope,
} from '@parton/api-contracts';
import type { z } from 'zod';

import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from './config';
import { openSystemRoute } from '../shared/system/system-route-store';
import { ApiClientError } from './api-error';

export { ApiClientError, refreshCredentialRejected } from './api-error';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  idempotencyKey?: string;
};

export async function apiRequest<T>(
  path: string,
  responseSchema: z.ZodType<SuccessEnvelope<T>>,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, accessToken, idempotencyKey } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': 'tr-TR, tr;q=0.9, en;q=0.8',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  let response: Response;
  let json: unknown;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // RN keeps Set-Cookie in the WebView jar. A stored refresh cookie without
      // x-csrf-token makes the next cold start fail CSRF and drop the session.
      credentials: 'omit',
    });
    json = await response.json();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const parsed = errorEnvelopeSchema.safeParse(json);
    if (parsed.success) {
      const code = parsed.data.error.code;
      if (code === 'SESSION_EXPIRED') {
        openSystemRoute('session-expired');
      } else if (code === 'ACCOUNT_RESTRICTED') {
        openSystemRoute('restriction');
      } else if (code === 'ACCOUNT_BANNED') {
        openSystemRoute('blocking');
      } else if (response.status === 403 && code === 'FORBIDDEN') {
        openSystemRoute('forbidden');
      }
      throw new ApiClientError(
        parsed.data.error.message,
        response.status,
        code,
        parsed.data.error.details,
      );
    }
    throw new ApiClientError(
      'Beklenmeyen sunucu hatası.',
      response.status,
      'INTERNAL_ERROR',
    );
  }

  const parsedSuccess = responseSchema.safeParse(json);
  if (!parsedSuccess.success) {
    throw new ApiClientError(
      'Sunucu yanıtı doğrulanamadı.',
      response.status,
      'VALIDATION_FAILED',
    );
  }

  return parsedSuccess.data.data;
}
