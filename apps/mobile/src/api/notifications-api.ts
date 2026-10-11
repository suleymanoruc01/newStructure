import {
  errorEnvelopeSchema,
  notificationListResponseSchema,
  pushTokenRegisterBodySchema,
  notificationPreferencesPatchSchema,
  notificationPreferencesResponseSchema,
  notificationReadAllResponseSchema,
  notificationResponseSchema,
  type NotificationPreferences,
  type NotificationPreferencesPatch,
  type PushTokenRegisterBody,
} from '@parton/api-contracts';

import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from './config';
import { ApiClientError, apiRequest } from './client';

export async function listNotifications(accessToken: string) {
  return apiRequest('/notifications', notificationListResponseSchema, {
    accessToken,
  });
}

export async function fetchNotification(accessToken: string, id: string) {
  return apiRequest(`/notifications/${id}`, notificationResponseSchema, {
    accessToken,
  });
}

export async function markNotificationRead(accessToken: string, id: string) {
  return apiRequest(`/notifications/${id}/read`, notificationResponseSchema, {
    method: 'POST',
    accessToken,
  });
}

export async function markAllNotificationsRead(accessToken: string) {
  return apiRequest('/notifications/read-all', notificationReadAllResponseSchema, {
    method: 'POST',
    accessToken,
  });
}

export async function fetchNotificationPreferences(accessToken: string) {
  return apiRequest(
    '/notifications/preferences',
    notificationPreferencesResponseSchema,
    { accessToken },
  );
}

async function emptyAuthRequest(
  path: string,
  method: 'POST' | 'DELETE',
  accessToken: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (response.status === 204) {
      return;
    }
    const json = (await response.json()) as unknown;
    const parsed = errorEnvelopeSchema.safeParse(json);
    if (parsed.success) {
      throw new ApiClientError(
        parsed.data.error.message,
        response.status,
        parsed.data.error.code,
      );
    }
    throw new ApiClientError(
      'Beklenmeyen sunucu hatası.',
      response.status,
      'INTERNAL_ERROR',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function registerPushToken(
  accessToken: string,
  body: PushTokenRegisterBody,
): Promise<void> {
  const parsed = pushTokenRegisterBodySchema.parse(body);
  await emptyAuthRequest('/devices/push-tokens', 'POST', accessToken, parsed);
}

export async function deleteCurrentPushToken(
  accessToken: string,
  token: string,
): Promise<void> {
  await emptyAuthRequest(
    '/devices/push-tokens/current',
    'DELETE',
    accessToken,
    undefined,
    { 'x-device-push-token': token },
  );
}

export async function patchNotificationPreferences(
  accessToken: string,
  body: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  const parsed = notificationPreferencesPatchSchema.parse(body);
  return apiRequest(
    '/notifications/preferences',
    notificationPreferencesResponseSchema,
    { method: 'PATCH', accessToken, body: parsed },
  );
}
