import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchWorkerProfile } from '../../../api/workers-api';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerProfileRoot'>;

export function WorkerProfileRootScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [complete, setComplete] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const profile = await fetchWorkerProfile(token);
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setComplete(profile.profileComplete);
      setMissing(profile.completionMissing ?? []);
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

  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    t('worker:profile.unnamed');

  return (
    <Screen scroll testID="m.worker.profile.root">
      <Text className="text-2xl font-bold text-text-high">
        {t('worker:profile.title')}
      </Text>
      <View className="mt-6 rounded-2xl bg-surface-1 p-4">
        <Text className="text-xl font-semibold text-text-high">
          {displayName}
        </Text>
        <Text className="mt-2 text-sm text-text-medium">
          {complete
            ? t('worker:profile.complete')
            : t('worker:profile.incomplete')}
        </Text>
        {!complete && missing.length > 0 ? (
          <View className="mt-3 gap-1">
            {missing.map((key) => (
              <Text key={key} className="text-sm text-text-low">
                · {t(`worker:profile.missing.${key}`, { defaultValue: key })}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <View className="mt-6">
        <Button
          label={t('worker:profile.editCta')}
          onPress={() => navigation.navigate('WorkerProfileEdit')}
        />
      </View>
      <Text className="mt-8 text-lg font-semibold text-text-high">
        {t('worker:profile.shortcuts')}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          className="rounded-full bg-surface-1 px-3 py-2"
          onPress={() => navigation.navigate('WorkerAvailabilityEdit')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navAvailability')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-full bg-surface-1 px-3 py-2"
          onPress={() => navigation.navigate('WorkerApplicationsList')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navApplications')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-full bg-surface-1 px-3 py-2"
          onPress={() => navigation.navigate('WorkerDocumentsList')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navDocuments')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-full bg-surface-1 px-3 py-2"
          onPress={() => navigation.navigate('SharedRatingsPending')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navRatings')}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable className="mt-6" onPress={() => void load()}>
        <Text className="text-center text-sm font-semibold text-brand-primary">
          {t('common:refresh')}
        </Text>
      </Pressable>
    </Screen>
  );
}
