import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Notification } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
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
import { ModulePage } from '../../../components/ui/ScreenModules';
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
          
          <Text className="font-sans mt-3 text-base text-text-medium">{item.body}</Text>
          {chosen ? (
            <Pressable
              accessibilityRole="button"
              className="mt-8 rounded-lg bg-action-primary px-4 py-3"
              onPress={openTarget}
            >
              <Text className="font-sans text-center text-base font-semibold text-text-on">
                {t('system:notifications.openTarget')}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Text className="font-sans text-text-medium">{t('common:loading')}</Text>
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ModulePage>
  );
}
