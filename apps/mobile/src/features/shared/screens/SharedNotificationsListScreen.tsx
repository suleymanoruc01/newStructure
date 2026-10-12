import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Notification } from '@parton/api-contracts';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
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
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ClayChip } from '../../../components/ui/ClayChip';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { NavRow } from '../../../components/ui/NavRow';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import {
  notificationsAllowed,
  requestPushAccess,
} from '../../../notifications/push-registration';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { notificationTypeLabel } from '../../../shared/notifications/type-label';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

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
  const [pushAllowed, setPushAllowed] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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
        .catch(() => setPushAllowed(false));
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
  const types = [...new Set(items.map((item) => item.type))];
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const visible = items.filter((item) => {
    if (unreadOnly && item.readAt) {
      return false;
    }
    if (typeFilter && item.type !== typeFilter) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return (
      item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
      item.body.toLocaleLowerCase('tr-TR').includes(needle) ||
      notificationTypeLabel(item.type).toLocaleLowerCase('tr-TR').includes(needle)
    );
  });
  const groups: Array<'today' | 'yesterday' | 'earlier'> = [
    'today',
    'yesterday',
    'earlier',
  ];

  const atRoot = useNavigationState((state) => state.index === 0);

  return (
    <ModulePage
      title={t('system:notifications.title')}
      testID="m.shared.notifications.list"
      dock={atRoot}
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
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
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('system:notifications.unread'),
                value: String(items.filter((item) => !item.readAt).length),
              },
              {
                label: t('system:notifications.filterAll'),
                value: String(items.length),
              },
            ]}
          />
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('system:notifications.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {([false, true] as const).map((value) => (
          <ClayChip
            key={value ? 'unread' : 'all'}
            label={
              value
                ? t('system:notifications.unread')
                : t('system:notifications.filterAll')
            }
            selected={unreadOnly === value}
            onPress={() => setUnreadOnly(value)}
          />
        ))}
        {types.map((type) => (
          <ClayChip
            key={type}
            label={notificationTypeLabel(type)}
            selected={typeFilter === type}
            onPress={() =>
              setTypeFilter((current) => (current === type ? null : type))
            }
          />
        ))}
      </View>
      {!loading && items.length === 0 ? (
        <View className="mt-6">
          <EmptyState
            testID="InboxEmpty"
            title={t('system:notifications.empty')}
          />
        </View>
      ) : null}
      {!loading && items.length > 0 && visible.length === 0 ? (
        <View className="mt-6">
          <EmptyState
            title={
              needle
                ? t('system:notifications.searchEmpty')
                : typeFilter
                  ? t('system:notifications.typeEmpty')
                  : t('system:notifications.unreadEmpty')
            }
          />
        </View>
      ) : null}
      {groups.map((group) => {
        const rows = visible.filter(
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
              <View key={item.id} className="mt-2" testID="NotificationRow">
                <JobCard
                  title={item.title}
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
                >
                  {item.readAt ? null : (
                    <StatusBadge
                      label={t('system:notifications.unread')}
                      tone="warn"
                    />
                  )}
                  <Text className="font-sans mt-1 text-sm text-text-medium">
                    {item.body}
                  </Text>
                  <Text className="font-sans mt-1 text-xs text-text-low">
                    {formatIstanbul(item.createdAt, zone)}
                  </Text>
                </JobCard>
              </View>
            ))}
          </View>
        );
      })}
      <View className="mt-6">
        <Button
          label={t('system:notifications.readAll')}
          onPress={() => void onReadAll()}
          variant="secondary"
        />
      </View>
      <View className="mt-3">
        <NavRow
          label={t('system:notifications.prefs')}
          onPress={() => navigation.navigate('SharedNotificationPrefs')}
        />
      </View>
    </ModulePage>
  );
}
