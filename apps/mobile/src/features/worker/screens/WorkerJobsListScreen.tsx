import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { fetchJobFeed } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobsList'>;

type FeedItem = {
  id: string;
  title: string | null;
  branchName?: string;
  startsAt: string;
  distanceKm?: number | null;
  matchReasons?: string[];
};

export function WorkerJobsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchJobFeed(token);
      setItems(
        data.items.map((job) => ({
          id: job.id,
          title: job.title ?? null,
          branchName: job.branchName,
          startsAt: job.startsAt,
          distanceKm: job.distanceKm,
          matchReasons: job.matchReasons,
        })),
      );
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

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ModulePage title={t('worker:jobs.title')} testID="m.worker.jobs.list" scroll dock>
      
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((job) => (
          <Pressable
            key={job.id}
            accessibilityRole="button"
            className="rounded-lg bg-surface-1 p-4"
            onPress={() =>
              navigation.navigate('WorkerJobDetail', { jobId: job.id })
            }
          >
            <Text className="font-sans text-lg font-semibold text-text-high">
              {job.title ?? job.branchName ?? t('worker:jobs.untitled')}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {formatIstanbul(job.startsAt, timeZone)}
            </Text>
            {job.distanceKm != null ? (
              <Text className="font-sans mt-1 text-sm text-text-low">
                {t('worker:jobs.distance', {
                  km: job.distanceKm.toFixed(1),
                })}
              </Text>
            ) : null}
            {job.matchReasons && job.matchReasons.length > 0 ? (
              <Text className="font-sans mt-2 text-xs text-text-medium">
                {job.matchReasons
                  .map((reason) =>
                    t(`worker:jobs.matchReasons.${reason}`, {
                      defaultValue: reason,
                    }),
                  )
                  .join(' · ')}
              </Text>
            ) : null}
          </Pressable>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">{t('worker:jobs.empty')}</Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
