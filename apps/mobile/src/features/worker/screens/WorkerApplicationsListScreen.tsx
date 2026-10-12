import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { statusLabelTr, type ApplicationStatus } from '@parton/api-contracts';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import {
  listMyApplications,
  withdrawApplication,
} from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ClayChip } from '../../../components/ui/ClayChip';
import { StatStrip } from '../../../components/ui/StatStrip';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  useDisplayTimeZone,
} from '../../../shared/datetime/istanbul';

type Filter = 'all' | ApplicationStatus;

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerApplicationsList'
>;

const FILTERS: Filter[] = [
  'all',
  'pending',
  'accepted',
  'substitute',
  'rejected',
  'withdrawn',
];

export function WorkerApplicationsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listMyApplications>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listMyApplications(token);
      setItems(data.items);
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
    const byStatus =
      filter === 'all' ? items : items.filter((item) => item.status === filter);
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return byStatus;
    }
    return byStatus.filter((item) => {
      const title = (item.jobTitle ?? '').toLocaleLowerCase('tr-TR');
      const branch = (item.branchName ?? '').toLocaleLowerCase('tr-TR');
      return title.includes(needle) || branch.includes(needle);
    });
  }, [filter, items, query]);

  return (
    <ModulePage
      title={t('worker:applications.title')}
      testID="m.worker.applications.list"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: statusLabelTr('pending'),
                value: String(
                  items.filter((item) => item.status === 'pending').length,
                ),
              },
              {
                label: statusLabelTr('accepted'),
                value: String(
                  items.filter((item) => item.status === 'accepted').length,
                ),
              },
              {
                label: t('worker:applications.filterAll'),
                value: String(items.length),
              },
            ]}
          />
        </View>
      ) : null}
      <View className="mt-3">
        <TextField
          inset
          shape="capsule"
          label={t('worker:applications.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {FILTERS.map((value) => (
          <ClayChip
            key={value}
            label={
              value === 'all'
                ? t('worker:applications.filterAll')
                : statusLabelTr(value)
            }
            selected={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((item) => (
          <JobCard
            key={item.id}
            status={item.status}
            title={item.jobTitle ?? t('worker:jobs.untitled')}
          >
            <Text className="font-sans text-xs text-text-low">
              {formatIstanbul(item.createdAt, timeZone)}
            </Text>
            {item.jobStartsAt && item.jobEndsAt ? (
              <JobFacts
                branchName={item.branchName}
                startsAt={item.jobStartsAt}
                endsAt={item.jobEndsAt}
                payAmountMinor={item.payAmountMinor}
                payCurrency={item.payCurrency}
                amenities={item.amenities}
              />
            ) : null}
            <View className="mt-3 gap-2">
              <Button
                label={t('worker:applications.process')}
                variant="secondary"
                onPress={() =>
                  navigation.navigate('SharedJobProcess', {
                    applicationId: item.id,
                  })
                }
              />
              {item.status === 'pending' ? (
                <Button
                  label={t('worker:applications.withdraw')}
                  variant="destructive"
                  onPress={() => {
                    void (async () => {
                      try {
                        const token = getAccessToken();
                        if (!token) {
                          throw new ApiClientError(
                            'Oturum bulunamadı.',
                            401,
                            'UNAUTHORIZED',
                          );
                        }
                        await withdrawApplication(item.id, token);
                        await load();
                      } catch (err) {
                        if (err instanceof ApiClientError) {
                          setError(
                            t(`errors:${err.code}`, {
                              defaultValue: err.message,
                            }),
                          );
                        } else {
                          setError(t('common:networkError'));
                        }
                      }
                    })();
                  }}
                />
              ) : null}
            </View>
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState
            title={t('worker:applications.empty')}
            actionLabel={t('worker:home.seeAllJobs')}
            onAction={() => navigation.navigate('WorkerJobsList')}
          />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? t('worker:applications.searchEmpty')
                : t('worker:applications.emptyFilter')
            }
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
