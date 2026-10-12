import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab } from '../../../app/navigation/dock-routes';
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
import { TextField } from '../../../components/ui/TextField';
import { NavRow } from '../../../components/ui/NavRow';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerHome'>;

type Summary = {
  available: number | null;
  held: number | null;
  branches: number | null;
  disputes: number | null;
  openSeats: number | null;
};

export function EmployerHomeScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors', 'system']);
  const timeZone = useDisplayTimeZone();
  const testID = route.params?.screenId ?? 'm.employer.home.root';
  const [summary, setSummary] = useState<Summary>({
    available: null,
    held: null,
    branches: null,
    disputes: null,
    openSeats: null,
  });
  const [jobs, setJobs] = useState<
    Awaited<ReturnType<typeof listEmployerJobs>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setError(t('errors:UNAUTHORIZED', { defaultValue: 'Oturum bulunamadı.' }));
      setLoading(false);
      return;
    }
    const [balance, branches, disputes, jobList] = await Promise.allSettled([
      fetchTokenBalance(token),
      listBranches(token),
      listEmployerOpenDisputes(token),
      listEmployerJobs(token),
    ]);
    setSummary({
      available: balance.status === 'fulfilled' ? balance.value.available : null,
      held: balance.status === 'fulfilled' ? balance.value.held : null,
      branches: branches.status === 'fulfilled' ? branches.value.items.length : null,
      disputes: disputes.status === 'fulfilled' ? disputes.value.items.length : null,
      openSeats:
        jobList.status === 'fulfilled'
          ? jobList.value.items
              .filter((job) => job.status === 'published')
              .reduce((sum, job) => sum + job.remainingHeadcount, 0)
          : null,
    });
    if (jobList.status === 'fulfilled') {
      setJobs(
        jobList.value.items.filter((job) => job.status === 'published'),
      );
    }
    if (
      balance.status === 'rejected' &&
      branches.status === 'rejected' &&
      disputes.status === 'rejected'
    ) {
      setError(t('common:networkError'));
    }
    setLoaded(true);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownJobs = needle
    ? jobs.filter((job) => {
        const title = (job.title ?? '').toLocaleLowerCase('tr-TR');
        const branch = (job.branchName ?? '').toLocaleLowerCase('tr-TR');
        return title.includes(needle) || branch.includes(needle);
      })
    : jobs;

  const eyebrow = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <ModulePage
      back="off"
      dock
      eyebrow={eyebrow}
      onRefresh={() => void load()}
      refreshing={loading}
      testID={testID}
      title={t('employer:home.title')}
    >
        <Button
          label={t('employer:jobs.create')}
          onPress={() =>
            openInTab(navigation, 'EmployerCreateJob', ['EmployerJobs', 'ManagerJobs'])
          }
        />
        {error ? (
          <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        <View className="mt-4">
          <StatStrip
            items={[
              {
                label: t('employer:home.statTokens'),
                value: summary.available == null ? '—' : String(summary.available),
              },
              {
                label: t('employer:home.statHeld'),
                value: summary.held == null ? '—' : String(summary.held),
              },
              {
                label: t('employer:home.statSeats'),
                value: summary.openSeats == null ? '—' : String(summary.openSeats),
              },
              {
                label: t('employer:home.statDisputes'),
                value: summary.disputes == null ? '—' : String(summary.disputes),
              },
            ]}
          />
        </View>
        <View className="mt-4">
          <NavRow
            label={`${t('employer:home.tokenTile')} · ${summary.available == null ? '—' : summary.available}`}
            onPress={() => navigation.navigate('EmployerTokensRoot')}
          />
          <NavRow
            label={`${t('employer:home.branchTile')} · ${summary.branches == null ? '—' : summary.branches}`}
            onPress={() =>
              openInTab(navigation, 'EmployerBranches', [
                'EmployerBranches',
                'ManagerHome',
              ])
            }
          />
          {(summary.disputes ?? 0) > 0 ? (
            <View className="mb-2">
              <Button
                label={t('employer:home.disputes', {
                  count: summary.disputes,
                })}
                onPress={() => navigation.navigate('EmployerOpenDisputes')}
              />
            </View>
          ) : (
            <NavRow
              label={`${t('employer:home.disputeTile')} · ${summary.disputes == null ? '—' : summary.disputes}`}
              onPress={() => navigation.navigate('EmployerOpenDisputes')}
            />
          )}
          <NavRow
            label={t('employer:home.openSeats', {
              count: summary.openSeats ?? '—',
            })}
            onPress={() =>
              openInTab(navigation, 'EmployerJobsList', [
                'EmployerJobs',
                'ManagerJobs',
              ])
            }
          />
          <NavRow
            label={t('employer:home.calendarTile')}
            onPress={() => navigation.navigate('EmployerCalendar')}
          />
          <NavRow
            label={t('employer:dashboard.title')}
            onPress={() => navigation.navigate('EmployerDashboard')}
          />
        </View>
        {!loaded ? (
          <View className="mt-6">
            <SkeletonList />
          </View>
        ) : null}
        {loaded && jobs.length > 0 ? (
          <View className="mt-4">
            <TextField
              inset
              shape="capsule"
              label={t('employer:home.searchJobs')}
              onChangeText={setQuery}
              value={query}
            />
          </View>
        ) : null}
        {loaded && jobs.length === 0 ? (
          <View className="mt-6">
            <EmptyState
              title={t('employer:jobs.empty')}
              actionLabel={t('employer:jobs.create')}
              onAction={() =>
                openInTab(navigation, 'EmployerCreateJob', [
                  'EmployerJobs',
                  'ManagerJobs',
                ])
              }
            />
          </View>
        ) : null}
        {loaded && jobs.length > 0 ? (
          <View className="mt-6 gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('employer:home.activeJobs')}
            </Text>
            {shownJobs.some(
              (job) =>
                job.branchLatitude != null && job.branchLongitude != null,
            ) ? (
              <JobsMap
                pins={shownJobs
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
                selectedId={shownJobs[0]?.id ?? null}
                onSelect={(id) =>
                  navigation.navigate('EmployerJobDetail', { jobId: id })
                }
              />
            ) : null}
            {shownJobs.map((job) => (
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
                />
              </JobCard>
            ))}
            {shownJobs.length === 0 ? (
              <EmptyState title={t('employer:jobs.searchEmpty')} />
            ) : null}
          </View>
        ) : null}
    </ModulePage>
  );
}
