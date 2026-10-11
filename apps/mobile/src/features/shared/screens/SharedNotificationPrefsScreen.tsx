import type { NotificationPreferences } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import {
  fetchNotificationPreferences,
  patchNotificationPreferences,
} from '../../../api/notifications-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

const KEYS = [
  'shifts',
  'applications',
  'matching',
  'favorites',
  'marketing',
] as const;

export function SharedNotificationPrefsScreen() {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      setPrefs(await fetchNotificationPreferences(token));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: (typeof KEYS)[number]) => {
    if (!prefs) {
      return;
    }
    const next = !prefs[key];
    setPrefs({ ...prefs, [key]: next });
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      setPrefs(await patchNotificationPreferences(token, { [key]: next }));
    } catch (err) {
      setPrefs(prefs);
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  return (
    <ModulePage title={t('system:notifications.prefsTitle')} testID="m.shared.notifications.push-prefs" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('system:notifications.prefsLead')}
      </Text>
      {prefs
        ? KEYS.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs[key] }}
              className="mt-3 rounded-xl bg-surface-1 px-4 py-3"
              onPress={() => void toggle(key)}
            >
              <Text className="font-sans text-base text-text-high">
                {t(`system:notifications.categories.${key}`)}
              </Text>
              <Text className="font-sans mt-1 text-sm text-text-medium">
                {prefs[key] ? t('common:yes') : t('common:no')}
              </Text>
            </Pressable>
          ))
        : (
          <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
        )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        className="mt-6"
        onPress={() => void Linking.openSettings()}
      >
        <Text className="font-sans text-base text-text-high">
          {t('system:notifications.openOsSettings')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
