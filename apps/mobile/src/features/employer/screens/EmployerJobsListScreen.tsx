import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { ApiClientError } from '../../../api/client';
import { listEmployerJobs } from '../../../api/jobs-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerJobsList'>;

export function EmployerJobsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [items, setItems] = useState<
    { id: string; status: string; title: string | null }[]
  >([]);
  const [tokens, setTokens] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [jobs, balance] = await Promise.all([
        listEmployerJobs(token),
        fetchTokenBalance(token),
      ]);
      setItems(
        jobs.items.map((j) => ({
          id: j.id,
          status: j.status,
          title: j.title,
        })),
      );
      setTokens(
        t('employer:jobs.tokenBalance', {
          available: balance.available,
          held: balance.held,
        }),
      );
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

  return (
    <Screen scroll testID="m.employer.jobs.list">
      <Text className="text-2xl font-bold text-text-high">
        {t('employer:jobs.title')}
      </Text>
      {tokens ? (
        <Pressable
          accessibilityRole="button"
          className="mt-2"
          onPress={() => navigation.navigate('EmployerTokensRoot')}
        >
          <Text className="text-base font-medium text-brand-primary">
            {tokens}
          </Text>
        </Pressable>
      ) : null}
      <View className="mt-4 gap-2">
        <Button
          label={t('employer:jobs.create')}
          onPress={() => navigation.navigate('EmployerCreateJob')}
        />
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-surface-1 px-3 py-2"
            onPress={() => navigation.navigate('EmployerVerificationStatus')}
          >
            <Text className="text-sm text-text-high">
              {t('employer:jobs.navVerification')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-surface-1 px-3 py-2"
            onPress={() => navigation.navigate('EmployerFavoriteWorkers')}
          >
            <Text className="text-sm text-text-high">
              {t('employer:jobs.navFavorites')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-surface-1 px-3 py-2"
            onPress={() => navigation.navigate('EmployerOpenDisputes')}
          >
            <Text className="text-sm text-text-high">
              {t('employer:jobs.navDisputes')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-surface-1 px-3 py-2"
            onPress={() => navigation.navigate('SharedRatingsPending')}
          >
            <Text className="text-sm text-text-high">
              {t('employer:jobs.navRatings')}
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="mt-6 gap-3">
        {items.map((job) => (
          <View key={job.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="text-lg font-semibold text-text-high">
              {job.title ?? job.id}
            </Text>
            <Text className="mt-1 text-sm text-text-medium">{job.status}</Text>
            <Pressable
              className="mt-3"
              onPress={() =>
                navigation.navigate('EmployerJobDetail', { jobId: job.id })
              }
            >
              <Text className="text-sm font-semibold text-brand-primary">
                {t('employer:jobs.detail.open')}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </Screen>
  );
}
