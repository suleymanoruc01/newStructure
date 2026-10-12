import type { NotificationPreferences } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import {
  fetchNotificationPreferences,
  patchNotificationPreferences,
} from '../../../api/notifications-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
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
      {prefs ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('common:yes'),
                value: String(KEYS.filter((key) => prefs[key]).length),
              },
              {
                label: t('common:no'),
                value: String(KEYS.filter((key) => !prefs[key]).length),
              },
            ]}
          />
        </View>
      ) : null}
      {prefs
        ? KEYS.map((key) => (
            <View key={key} className="mt-3">
              <JobCard
                title={t(`system:notifications.categories.${key}`)}
                onPress={() => void toggle(key)}
              >
                <StatusBadge
                  label={prefs[key] ? t('common:yes') : t('common:no')}
                  tone={prefs[key] ? 'strong' : 'neutral'}
                />
              </JobCard>
            </View>
          ))
        : (
          <View className="mt-4">
            <SkeletonList rows={5} />
          </View>
        )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-6"
        label={t('system:notifications.openOsSettings')}
        onPress={() => void Linking.openSettings()}
        variant="secondary"
      />
    </ModulePage>
  );
}
