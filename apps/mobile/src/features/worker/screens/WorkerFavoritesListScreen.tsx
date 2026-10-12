import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab } from '../../../app/navigation/dock-routes';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { listFavorites } from '../../../api/favorites-api';
import { ApiClientError } from '../../../api/client';
import { JobCard } from '../../../components/job/JobCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ClayChip } from '../../../components/ui/ClayChip';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  useDisplayTimeZone,
} from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerFavoritesList'>;

type KindFilter = 'all' | 'employer' | 'worker';

export function WorkerFavoritesListScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listFavorites>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listFavorites(token);
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
    return items.filter((item) => {
      if (kind !== 'all' && item.type !== kind) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const label = (item.targetLabel ?? '').toLocaleLowerCase('tr-TR');
      const typeLabel =
        item.type === 'employer'
          ? t('worker:favorites.employer').toLocaleLowerCase('tr-TR')
          : t('worker:favorites.worker').toLocaleLowerCase('tr-TR');
      return label.includes(needle) || typeLabel.includes(needle);
    });
  }, [items, kind, query, t]);

  return (
    <ModulePage
      title={t('worker:favorites.title')}
      testID="m.worker.favorites.list"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:favorites.lead')}
      </Text>
      <View className="mt-3">
        <TextField
          inset
          shape="capsule"
          label={t('worker:favorites.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {(['all', 'employer', 'worker'] as const).map((value) => (
          <ClayChip
            key={value}
            label={
              value === 'all'
                ? t('worker:favorites.filterAll')
                : t(`worker:favorites.${value}`)
            }
            selected={kind === value}
            onPress={() => setKind(value)}
          />
        ))}
      </View>
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-4">
          <StatStrip
            items={[
              {
                label: t('worker:jobs.navFavorites'),
                value: String(items.length),
              },
              {
                label: t('worker:favorites.employer'),
                value: String(
                  items.filter((item) => item.type === 'employer').length,
                ),
              },
              {
                label: t('worker:favorites.worker'),
                value: String(
                  items.filter((item) => item.type === 'worker').length,
                ),
              },
              {
                label: t('worker:favorites.mutual'),
                value: String(items.filter((item) => item.mutual).length),
              },
            ]}
          />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((item) => (
          <JobCard
            key={item.id}
            title={
              item.targetLabel ??
              (item.type === 'employer'
                ? t('worker:favorites.employer')
                : t('worker:favorites.worker'))
            }
            onPress={
              item.type === 'employer'
                ? () =>
                    openInTab(navigation, 'WorkerJobsList', ['WorkerJobs'], {
                      query: item.targetLabel ?? undefined,
                    })
                : undefined
            }
          >
            <Text className="font-sans text-xs text-text-low">
              {item.type === 'employer'
                ? t('worker:favorites.employer')
                : t('worker:favorites.worker')}
            </Text>
            <Text className="font-sans mt-1 text-xs text-text-low">
              {formatIstanbul(item.createdAt, timeZone)}
            </Text>
            {item.mutual ? (
              <View className="mt-2">
                <StatusBadge
                  label={t('worker:favorites.mutual')}
                  tone="strong"
                />
              </View>
            ) : null}
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState title={t('worker:favorites.empty')} />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState title={t('worker:favorites.searchEmpty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
