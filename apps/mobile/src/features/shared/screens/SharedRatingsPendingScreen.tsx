import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { listPendingRatings } from '../../../api/ratings-api';
import { JobCard } from '../../../components/job/JobCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'SharedRatingsPending'
>;

export function SharedRatingsPendingScreen({ navigation }: Props) {
  const { t } = useTranslation(['ratings', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listPendingRatings>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listPendingRatings(token);
      setItems(data.items ?? []);
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

  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return items;
    }
    return items.filter((item) => {
      const title = (item.jobTitle ?? '').toLocaleLowerCase('tr-TR');
      const branch = (item.branchName ?? '').toLocaleLowerCase('tr-TR');
      const who = (item.counterpartLabel ?? '').toLocaleLowerCase('tr-TR');
      return (
        title.includes(needle) || branch.includes(needle) || who.includes(needle)
      );
    });
  }, [items, query]);

  return (
    <ModulePage
      title={t('ratings:pending.title')}
      testID="m.shared.ratings.pending"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('ratings:pending.lead')}
      </Text>
      {items.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('ratings:pending.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('ratings:pending.statPending'),
                value: String(shown.length),
              },
            ]}
          />
        </View>
      ) : null}
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((item) => (
          <JobCard
            key={item.shiftId}
            title={item.jobTitle ?? t('ratings:pending.untitled')}
            onPress={() =>
              navigation.navigate('SharedRatingsCompose', {
                shiftId: item.shiftId,
                counterpartLabel: item.counterpartLabel,
                jobTitle: item.jobTitle,
              })
            }
          >
            {item.branchName ? (
              <Text className="font-sans text-sm text-text-medium">
                {item.branchName}
              </Text>
            ) : null}
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {item.counterpartLabel}
            </Text>
            <Text className="font-sans mt-1 text-xs text-text-low">
              {t('ratings:pending.opens', {
                time: formatIstanbul(item.opensAt, timeZone),
              })}
            </Text>
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState title={t('ratings:pending.empty')} />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState title={t('ratings:pending.searchEmpty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
