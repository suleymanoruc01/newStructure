import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { listBranches } from '../../../api/branches-api';
import { listEmployerJobs } from '../../../api/jobs-api';
import { listEmployerOpenDisputes } from '../../../api/shifts-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { JobsMap } from '../../../components/map/JobsMap';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerDashboard'>;

export function EmployerDashboardScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [branches, setBranches] = useState<number | null>(null);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [openSeats, setOpenSeats] = useState<number | null>(null);
  const [disputes, setDisputes] = useState<number | null>(null);
  const [published, setPublished] = useState<
    Awaited<ReturnType<typeof listEmployerJobs>>['items']
  >([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError(t('errors:UNAUTHORIZED'));
      setLoading(false);
      return;
    }
    const [balance, branchList, jobs, disputeList] = await Promise.allSettled([
      fetchTokenBalance(token),
      listBranches(token),
      listEmployerJobs(token),
      listEmployerOpenDisputes(token),
    ]);
    if (balance.status === 'fulfilled') {
      setAvailable(balance.value.available);
      setHeld(balance.value.held);
    }
    if (branchList.status === 'fulfilled') {
      setBranches(branchList.value.items.length);
    }
    if (jobs.status === 'fulfilled') {
      const counts: Record<string, number> = {};
      let seats = 0;
      for (const job of jobs.value.items) {
        counts[job.status] = (counts[job.status] ?? 0) + 1;
        if (job.status === 'published') {
          seats += job.remainingHeadcount;
        }
      }
      setByStatus(counts);
      setOpenSeats(seats);
      setPublished(
        jobs.value.items.filter((job) => job.status === 'published'),
      );
    }
    if (disputeList.status === 'fulfilled') {
      setDisputes(disputeList.value.items.length);
    }
    if (
      balance.status === 'rejected' &&
      branchList.status === 'rejected' &&
      jobs.status === 'rejected'
    ) {
      setError(t('common:networkError'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownPublished = needle
    ? published.filter((job) => {
        const title = (job.title ?? '').toLocaleLowerCase('tr-TR');
        const branch = (job.branchName ?? '').toLocaleLowerCase('tr-TR');
        return title.includes(needle) || branch.includes(needle);
      })
    : published;

  return (
    <ModulePage
      title={t('employer:dashboard.title')}
      testID="m.employer.dashboard"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading && published.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        <StatStrip
          items={[
            {
              label: t('employer:home.statTokens'),
              value: available == null ? '—' : String(available),
            },
            {
              label: t('employer:home.statHeld'),
              value: held == null ? '—' : String(held),
            },
            {
              label: t('employer:home.statBranches'),
              value: branches == null ? '—' : String(branches),
            },
            {
              label: t('employer:home.statSeats'),
              value: openSeats == null ? '—' : String(openSeats),
            },
            {
              label: t('employer:home.statDisputes'),
              value: disputes == null ? '—' : String(disputes),
            },
            ...Object.entries(byStatus).map(([status, count]) => ({
              label: statusLabelTr(status),
              value: String(count),
            })),
          ]}
        />
        {shownPublished.some(
          (job) =>
            job.branchLatitude != null && job.branchLongitude != null,
        ) ? (
          <JobsMap
            pins={shownPublished
              .filter(
                (job) =>
                  job.branchLatitude != null && job.branchLongitude != null,
              )
              .map((job) => ({
                id: job.id,
                title: job.title ?? job.branchName ?? job.id,
                latitude: job.branchLatitude!,
                longitude: job.branchLongitude!,
              }))}
            selectedId={shownPublished[0]?.id ?? null}
            onSelect={(id) =>
              navigation.navigate('EmployerJobDetail', { jobId: id })
            }
          />
        ) : null}
        {published.length > 0 ? (
          <TextField
            inset
            shape="capsule"
            label={t('employer:jobs.search')}
            onChangeText={setQuery}
            value={query}
          />
        ) : null}
        {disputes ? (
          <Button
            label={t('employer:dashboard.openDisputes')}
            onPress={() => navigation.navigate('EmployerOpenDisputes')}
          />
        ) : null}
        {shownPublished.map((job) => (
          <JobCard
            key={job.id}
            status={job.status}
            title={job.title ?? job.id}
            onPress={() =>
              navigation.navigate('EmployerJobDetail', { jobId: job.id })
            }
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
        ))}
        {!loading && published.length > 0 && shownPublished.length === 0 ? (
          <EmptyState title={t('employer:jobs.searchEmpty')} />
        ) : null}
        {!loading && published.length === 0 ? (
          <EmptyState
            title={t('employer:dashboard.empty')}
            actionLabel={t('employer:jobs.create')}
            onAction={() => navigation.navigate('EmployerCreateJob')}
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
