import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab } from '../../../app/navigation/dock-routes';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { listJobApplications } from '../../../api/applications-api';
import { createFavorite, listFavorites } from '../../../api/favorites-api';
import { listEmployerJobs } from '../../../api/jobs-api';
import { Button } from '../../../components/ui/Button';
import { JobCard } from '../../../components/job/JobCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  useDisplayTimeZone,
} from '../../../shared/datetime/istanbul';
import { uniqueWorkerCandidates } from '../../../shared/favorites/unique-worker-candidates';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerFavoriteWorkers'
>;

type Candidate = { workerUserId: string; label: string };

export function EmployerFavoriteWorkersScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listFavorites>>['items']
  >([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listFavorites(token);
      const workers = (data.items ?? []).filter((fav) => fav.type === 'worker');
      setItems(workers);
      const jobs = await listEmployerJobs(token);
      const lists = await Promise.all(
        (jobs.items ?? []).map(async (job) => {
          try {
            return await listJobApplications(job.id, token, 'accepted');
          } catch (err) {
            if (err instanceof ApiClientError && err.status === 403) {
              return {
                items: [] as Awaited<
                  ReturnType<typeof listJobApplications>
                >['items'],
              };
            }
            throw err;
          }
        }),
      );
      setCandidates(
        uniqueWorkerCandidates(
          lists.flatMap((list) => list.items ?? []),
          workers.map((fav) => fav.targetId),
          t('employer:favorites.workerLabel'),
        ),
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

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownFavs = useMemo(
    () =>
      needle
        ? items.filter((fav) =>
            (fav.targetLabel ?? '')
              .toLocaleLowerCase('tr-TR')
              .includes(needle),
          )
        : items,
    [items, needle],
  );
  const shownCandidates = useMemo(
    () =>
      needle
        ? candidates.filter((row) =>
            (row.label ?? '').toLocaleLowerCase('tr-TR').includes(needle),
          )
        : candidates,
    [candidates, needle],
  );

  const onAdd = async (id: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await createFavorite(token, { type: 'worker', id }, `fav-worker-${id}`);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage
      title={t('employer:favorites.title')}
      testID="m.employer.favorites.workers"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('employer:favorites.lead')}
      </Text>
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-3">
        <TextField
          inset
          shape="capsule"
          label={t('employer:favorites.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      {items.length > 0 ? (
        <View className="mt-4">
          <StatStrip
            items={[
              {
                label: t('employer:favorites.workerLabel'),
                value: String(items.length),
              },
              {
                label: t('employer:favorites.mutual'),
                value: String(items.filter((fav) => fav.mutual).length),
              },
            ]}
          />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shownFavs.map((fav) => (
          <JobCard
            key={fav.id}
            title={fav.targetLabel ?? t('employer:favorites.workerLabel')}
          >
            <Text className="font-sans text-xs text-text-low">
              {formatIstanbul(fav.createdAt, timeZone)}
            </Text>
            {fav.mutual ? (
              <View className="mt-2">
                <StatusBadge
                  label={t('employer:favorites.mutual')}
                  tone="strong"
                />
              </View>
            ) : null}
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState title={t('employer:favorites.empty')} />
        ) : null}
        {!loading && items.length > 0 && shownFavs.length === 0 ? (
          <EmptyState title={t('employer:favorites.searchEmpty')} />
        ) : null}
      </View>
      {candidates.length > 0 ? (
        <View className="mt-6 gap-3">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:favorites.pickLead')}
          </Text>
          {shownCandidates.map((candidate) => (
            <JobCard
              key={candidate.workerUserId}
              disabled={submitting}
              title={candidate.label}
              onPress={() => void onAdd(candidate.workerUserId)}
            >
              <Button
                disabled={submitting}
                label={t('employer:favorites.add')}
                variant="secondary"
                onPress={() => void onAdd(candidate.workerUserId)}
              />
            </JobCard>
          ))}
        </View>
      ) : null}
      <View className="mt-6">
        <Button
          label={t('employer:jobs.applicants')}
          variant="ghost"
          onPress={() =>
            openInTab(navigation, 'EmployerJobsList', [
              'EmployerJobs',
              'ManagerJobs',
            ])
          }
        />
      </View>
    </ModulePage>
  );
}
