import {
  errorEnvelopeSchema,
  type ApiErrorBody,
  type SuccessEnvelope,
} from '@parton/api-contracts';
import type { z } from 'zod';

import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from './config';
import { openSystemRoute } from '../shared/system/system-route-store';

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
