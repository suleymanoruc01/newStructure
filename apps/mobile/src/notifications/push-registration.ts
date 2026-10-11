import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import {
  deleteCurrentPushToken,
  registerPushToken,
} from '../api/notifications-api';
import { notificationTarget, queueDeepLink } from '../app/navigation/deep-link';
import { loadOrCreateDeviceInstallId } from '../shared/auth/secure-storage';
import { mayRequestNotifications } from '../shared/privacy/permission-moment';

let currentToken: string | null = null;

export function currentPushToken(): string | null {
  return currentToken;
}

export async function unregisterPushToken(accessToken: string): Promise<void> {
  const token = currentToken;
  currentToken = null;
  if (!token) {
    return;
  }
  await deleteCurrentPushToken(accessToken, token);
}

function openMessage(message: RemoteMessage | null): void {
  if (!message?.data) {
    return;
  }
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(message.data)) {
    if (typeof value === 'string') {
      data[key] = value;
    }
  }
  const type = data.type;
  if (!type) {
    return;
  }
  const target = notificationTarget(type, data);
  if (target) {
    queueDeepLink(target);
  }
}

async function publishToken(accessToken: string, token: string): Promise<void> {
  if (token.length < 32) {
    return;
  }
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const deviceId = await loadOrCreateDeviceInstallId();
  await registerPushToken(accessToken, {
    token,
    platform,
    deviceId,
    appVersion: '1.0',
  });
  currentToken = token;
}

function iosAllowed(status: number): boolean {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export async function notificationsAllowed(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < 33) {
      return true;
    }
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  const messaging = getMessaging(getApp());
  return iosAllowed(await hasPermission(messaging));
}

async function publishCurrentToken(accessToken: string): Promise<void> {
  const messaging = getMessaging(getApp());
  const token = await getToken(messaging);
  await publishToken(accessToken, token);
}

export async function requestPushAccess(accessToken: string): Promise<boolean> {
  if (!mayRequestNotifications('inbox')) {
    return false;
  }
  const messaging = getMessaging(getApp());
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }
  if (Platform.OS === 'ios') {
    const status = await requestPermission(messaging);
    if (!iosAllowed(status)) {
      return false;
    }
  }
  await publishCurrentToken(accessToken);
  return true;
}

export function startPushRegistration(accessToken: string): () => void {
  let stopped = false;
  const stops: Array<() => void> = [];

  void (async () => {
    try {
      const messaging = getMessaging(getApp());
      stops.push(
        onTokenRefresh(messaging, (next) => {
          void publishToken(accessToken, next).catch(() => undefined);
        }),
      );
      stops.push(onNotificationOpenedApp(messaging, openMessage));
      openMessage(await getInitialNotification(messaging));
      if (stopped) {
        return;
      }
      if (await notificationsAllowed()) {
        await publishCurrentToken(accessToken);
      }
    } catch {
      // Missing google-services.json / GoogleService-Info.plist, or a simulator without APNs.
    }
  })();

  return () => {
    stopped = true;
    for (const stop of stops) {
      stop();
    }
  };
}
