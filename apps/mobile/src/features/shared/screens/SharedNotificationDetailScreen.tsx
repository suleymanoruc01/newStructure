import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Notification } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  notificationTarget,
  openRoute,
  pickRoute,
} from '../../../app/navigation/deep-link';
import { ApiClientError } from '../../../api/client';
import {
  fetchNotification,
  markNotificationRead,
} from '../../../api/notifications-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { notificationTypeLabel } from '../../../shared/notifications/type-label';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';
import { getAccessToken } from '../../../shared/auth/session-memory';

type DetailNav = {
  SharedNotificationDetail: { notificationId: string };
  WorkerShiftCheckIn: { shiftId: string };
  EmployerJobDetail: { jobId: string };
};

type Props = {
  navigation: NativeStackNavigationProp<DetailNav>;
  route: RouteProp<DetailNav, 'SharedNotificationDetail'>;
};

export function SharedNotificationDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const zone = useDisplayTimeZone();
  const [item, setItem] = useState<Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const row = await fetchNotification(token, route.params.notificationId);
      setItem(row);
      if (!row.readAt) {
        const read = await markNotificationRead(token, row.id);
        setItem(read);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [route.params.notificationId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const names = navigation.getState().routeNames as string[];
  const target = item ? notificationTarget(item.type, item.data) : null;
  const chosen = target ? pickRoute(target, names) : null;

  const openTarget = () => {
    if (!chosen) {
      return;
    }
    openRoute(navigation, chosen);
  };

  return (
    <ModulePage title={item?.title ?? t('system:notifications.title')} testID="m.shared.notifications.detail" scroll>
      {item ? (
        <>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <StatusBadge
              label={
                item.readAt
                  ? t('system:notifications.read')
                  : t('system:notifications.unread')
              }
              tone={item.readAt ? 'neutral' : 'warn'}
            />
            <StatusBadge
              label={notificationTypeLabel(item.type)}
              tone="neutral"
            />
          </View>
          <View className="mt-3">
            <JobCard title={item.title}>
              <Text className="font-sans text-base text-text-medium">
                {item.body}
              </Text>
              <Text className="font-sans mt-2 text-xs text-text-low">
                {formatIstanbul(item.createdAt, zone)}
              </Text>
            </JobCard>
          </View>
          {chosen ? (
            <Button
              className="mt-8"
              label={t('system:notifications.openTarget')}
              onPress={openTarget}
            />
          ) : null}
        </>
      ) : (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ModulePage>
  );
}
