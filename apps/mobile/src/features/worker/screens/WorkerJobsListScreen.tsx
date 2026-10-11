import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { Screen } from '../../../components/ui/Screen';
import { ApiClientError } from '../../../api/client';
import { fetchJobFeed } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';

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
          title: job.title,
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
    <Screen scroll testID="m.worker.jobs.list">
      <Text className="text-2xl font-bold text-text-high">
        {t('worker:jobs.title')}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          className="rounded-full bg-surface-1 px-3 py-2"
          onPress={() => navigation.navigate('WorkerProfileRoot')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navProfile')}
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
          onPress={() => navigation.navigate('WorkerFavoritesList')}
        >
          <Text className="text-sm text-text-high">
            {t('worker:jobs.navFavorites')}
          </Text>
        </Pressable>
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
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((job) => (
          <Pressable
            key={job.id}
            accessibilityRole="button"
            className="rounded-2xl bg-surface-1 p-4"
            onPress={() =>
              navigation.navigate('WorkerJobDetail', { jobId: job.id })
            }
          >
            <Text className="text-lg font-semibold text-text-high">
              {job.title ?? job.branchName ?? t('worker:jobs.untitled')}
            </Text>
            <Text className="mt-1 text-sm text-text-medium">
              {new Date(job.startsAt).toLocaleString('tr-TR')}
            </Text>
            {job.distanceKm != null ? (
              <Text className="mt-1 text-sm text-text-low">
                {t('worker:jobs.distance', {
                  km: job.distanceKm.toFixed(1),
                })}
              </Text>
            ) : null}
            {job.matchReasons && job.matchReasons.length > 0 ? (
              <Text className="mt-2 text-xs text-text-medium">
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
          <Text className="text-text-medium">{t('worker:jobs.empty')}</Text>
        ) : null}
      </View>
    </Screen>
  );
}
