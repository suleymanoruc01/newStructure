import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Notification } from '@parton/api-contracts';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigationState } from '@react-navigation/native';

import {
  notificationTarget,
  openRoute,
  pickRoute,
} from '../../../app/navigation/deep-link';
import { ApiClientError } from '../../../api/client';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../api/notifications-api';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import {
  notificationsAllowed,
  requestPushAccess,
} from '../../../notifications/push-registration';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type InboxNav = {
  SharedNotificationDetail: { notificationId: string };
  SharedNotificationPrefs: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<InboxNav>;
};

function civilDate(value: Date, zone: string): string {
  return value.toLocaleDateString('en-CA', { timeZone: zone });
}

function shiftCivilDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function bucketOf(
  createdAt: string,
  zone: string,
  now: Date,
): 'today' | 'yesterday' | 'earlier' {
  const day = civilDate(new Date(createdAt), zone);
  const today = civilDate(now, zone);
  if (day === today) {
    return 'today';
  }
  if (day === shiftCivilDate(today, -1)) {
    return 'yesterday';
  }
  return 'earlier';
}

export function SharedNotificationsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const zone = useDisplayTimeZone();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushAllowed, setPushAllowed] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listNotifications(token);
      setItems(data.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void notificationsAllowed()
        .then(setPushAllowed)
        .catch(() => setPushAllowed(true));
    }, [load]),
  );

  const onAllowPush = async () => {
    const token = getAccessToken();
    if (!token) {
      setError(t('errors:UNAUTHORIZED', { defaultValue: 'Oturum bulunamadı.' }));
      return;
    }
    try {
      setPushAllowed(await requestPushAccess(token));
    } catch {
      setError(t('common:networkError'));
    }
  };

  const onReadAll = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await markAllNotificationsRead(token);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  const now = new Date();
  const groups: Array<'today' | 'yesterday' | 'earlier'> = [
    'today',
    'yesterday',
    'earlier',
  ];

  const atRoot = useNavigationState((state) => state.index === 0);

  return (
    <ModulePage title={t('system:notifications.title')} testID="m.shared.notifications.list" scroll dock={atRoot}>
      
      {pushAllowed ? null : (
        <View className="gap-3">
          <Text className="font-sans text-sm text-text-medium">
            {t('system:notifications.permissionWhy')}
          </Text>
          <Button
            label={t('system:notifications.permissionCta')}
            onPress={() => void onAllowPush()}
          />
        </View>
      )}
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {!loading && items.length === 0 ? (
        <Text className="font-sans mt-6 text-text-medium" testID="InboxEmpty">
          {t('system:notifications.empty')}
        </Text>
      ) : null}
      {groups.map((group) => {
        const rows = items.filter(
          (item) => bucketOf(item.createdAt, zone, now) === group,
        );
        if (rows.length === 0) {
          return null;
        }
        return (
          <View key={group} className="mt-6">
            <Text className="font-sans text-sm font-semibold text-text-medium">
              {t(`system:notifications.${group}`)}
            </Text>
            {rows.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                className="mt-2 rounded-xl bg-surface-1 p-4"
                onPress={() => {
                  const names = navigation.getState().routeNames as string[];
                  const target = notificationTarget(item.type, item.data);
                  const chosen = target ? pickRoute(target, names) : null;
                  if (!chosen) {
                    navigation.navigate('SharedNotificationDetail', {
                      notificationId: item.id,
                    });
                    return;
                  }
                  const token = getAccessToken();
                  if (token && !item.readAt) {
                    void markNotificationRead(token, item.id);
                  }
                  openRoute(navigation, chosen);
                }}
                testID="NotificationRow"
              >
                <View className="flex-row items-center gap-2">
                  {item.readAt ? null : (
                    <View className="h-2 w-2 rounded-lg bg-accent-mustard" />
                  )}
                  <Text className="font-sans flex-1 font-semibold text-text-high">
                    {item.title}
                  </Text>
                </View>
                <Text className="font-sans mt-1 text-sm text-text-medium">{item.body}</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        className="mt-6 min-h-12 justify-center"
        onPress={() => void onReadAll()}
      >
        <Text className="font-sans text-base text-text-high">
          {t('system:notifications.readAll')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        className="min-h-12 justify-center"
        onPress={() => navigation.navigate('SharedNotificationPrefs')}
      >
        <Text className="font-sans text-base text-text-high">
          {t('system:notifications.prefs')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
