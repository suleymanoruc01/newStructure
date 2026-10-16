import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Job } from '@parton/api-contracts';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { JobsMap } from '../../../components/map/JobsMap';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ClayChip } from '../../../components/ui/ClayChip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { listEmployerJobs } from '../../../api/jobs-api';
import { uniqueJobBranches } from '../../../shared/jobs/unique-branches';
import { hasManagerPermission } from '../../../shared/auth/manager-permissions';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerJobsList'>;
type StatusFilter = 'all' | Job['status'];

export function EmployerJobsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listEmployerJobs>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const jobs = await listEmployerJobs(token);
      setItems(jobs.items ?? []);
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

  const branches = useMemo(() => uniqueJobBranches(items), [items]);
  const shown = useMemo(() => {
    const byStatus =
      statusFilter === 'all'
        ? items
        : items.filter((job) => job.status === statusFilter);
    const byBranch = branchId
      ? byStatus.filter((job) => job.branchId === branchId)
      : byStatus;
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return byBranch;
    }
    return byBranch.filter((job) => {
      const title = (job.title ?? '').toLocaleLowerCase('tr-TR');
      const branch = (job.branchName ?? '').toLocaleLowerCase('tr-TR');
      return title.includes(needle) || branch.includes(needle);
    });
  }, [branchId, items, query, statusFilter]);
  const pins = useMemo(
    () =>
      shown.filter(
        (job) => job.branchLatitude != null && job.branchLongitude != null,
      ),
    [shown],
  );

  useEffect(() => {
    if (view !== 'map') {
      return;
    }
    if (selectedId && pins.some((job) => job.id === selectedId)) {
      return;
    }
    setSelectedId(pins[0]?.id ?? null);
  }, [view, pins, selectedId]);

  const filters: StatusFilter[] = ['all', 'published', 'draft', 'closed'];

  return (
    <ModulePage
      title={t('employer:jobs.title')}
      testID="m.employer.jobs.list"
      dock
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      <View className="mt-2 flex-row flex-wrap gap-2">
        {(['list', 'map'] as const).map((mode) => (
          <ClayChip
            key={mode}
            label={mode === 'list' ? t('employer:jobs.viewList') : t('employer:jobs.viewMap')}
            selected={view === mode}
            onPress={() => setView(mode)}
          />
        ))}
        {filters.map((value) => (
          <ClayChip
            key={value}
            label={value === 'all' ? t('employer:jobs.filterAll') : statusLabelTr(value)}
            selected={statusFilter === value}
            onPress={() => setStatusFilter(value)}
          />
        ))}
        {branches.length > 1
          ? branches.map((branch) => (
              <ClayChip
                key={branch.branchId}
                label={branch.label}
                selected={branchId === branch.branchId}
                onPress={() =>
                  setBranchId((current) =>
                    current === branch.branchId ? null : branch.branchId,
                  )
                }
              />
            ))
          : null}
      </View>
      <View className="mt-3">
        <TextField
          inset
          shape="capsule"
          label={t('employer:jobs.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      {items.length > 0 ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: statusLabelTr('published'),
                value: String(
                  items.filter((job) => job.status === 'published').length,
                ),
              },
              {
                label: statusLabelTr('draft'),
                value: String(
                  items.filter((job) => job.status === 'draft').length,
                ),
              },
              {
                label: t('employer:home.statSeats'),
                value: String(
                  items
                    .filter((job) => job.status === 'published')
                    .reduce((sum, job) => sum + job.remainingHeadcount, 0),
                ),
              },
            ]}
          />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {hasManagerPermission('jobs.create') ? (
        <View className="mt-4">
          <Button
            label={t('employer:jobs.create')}
            onPress={() => navigation.navigate('EmployerCreateJob')}
          />
        </View>
      ) : null}
      {view === 'map' ? (
        <View className="mt-6 gap-3">
          {pins.length === 0 ? (
            <EmptyState title={t('employer:jobs.mapEmpty')} />
          ) : (
            <JobsMap
              pins={pins.map((job) => ({
                id: job.id,
                title:
                  job.title ??
                  job.branchName ??
                  t('employer:jobs.untitledShift', { defaultValue: 'Vardiya' }),
                latitude: job.branchLatitude!,
                longitude: job.branchLongitude!,
              }))}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {shown
            .filter((job) => job.id === selectedId)
            .map((job) => (
              <EmployerJobCard
                key={job.id}
                job={job}
                onPress={() =>
                  navigation.navigate('EmployerJobDetail', { jobId: job.id })
                }
              />
            ))}
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {shown.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={job}
              onPress={() =>
                navigation.navigate('EmployerJobDetail', { jobId: job.id })
              }
            />
          ))}
          {!loading && items.length === 0 ? (
            <EmptyState
              title={t('employer:jobs.empty')}
              actionLabel={
                hasManagerPermission('jobs.create')
                  ? t('employer:jobs.create')
                  : undefined
              }
              onAction={
                hasManagerPermission('jobs.create')
                  ? () => navigation.navigate('EmployerCreateJob')
                  : undefined
              }
            />
          ) : null}
          {!loading && items.length > 0 && shown.length === 0 ? (
            <EmptyState title={t('employer:jobs.searchEmpty')} />
          ) : null}
        </View>
      )}
    </ModulePage>
  );
}

function EmployerJobCard({
  job,
  onPress,
}: {
  job: Awaited<ReturnType<typeof listEmployerJobs>>['items'][number];
  onPress: () => void;
}) {
  return (
    <JobCard
      onPress={onPress}
      status={job.status}
      title={job.title ?? job.branchName ?? 'Vardiya'}
    >
      <JobFacts
        branchName={job.branchName}
        startsAt={job.startsAt}
        endsAt={job.endsAt}
        payAmountMinor={job.payAmountMinor}
        payCurrency={job.payCurrency}
        headcount={job.headcount}
        remainingHeadcount={job.remainingHeadcount}
        favoritesOnly={job.favoritesOnly}
        instantAutoApprove={job.instantAutoApprove}
        amenities={job.amenities}
      />
    </JobCard>
  );
}
