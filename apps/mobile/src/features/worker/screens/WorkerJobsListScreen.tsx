import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { sortFeed, type FeedSort } from '../../../components/job/sort-feed';
import { JobsMap } from '../../../components/map/JobsMap';
import { ClayChip } from '../../../components/ui/ClayChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatStrip } from '../../../components/ui/StatStrip';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { listMyApplications } from '../../../api/applications-api';
import { fetchJobCatalog, fetchJobFeed } from '../../../api/jobs-api';
import { listMyShifts } from '../../../api/shifts-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  jobsListTabStatuses,
  type JobsListTab,
} from '../../../shared/jobs/jobs-list-tab';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobsList'>;

type FeedItem = Awaited<ReturnType<typeof fetchJobFeed>>['items'][number];
type AppItem = Awaited<ReturnType<typeof listMyApplications>>['items'][number];
type ShiftItem = Awaited<ReturnType<typeof listMyShifts>>['items'][number];
const TABS: JobsListTab[] = ['feed', 'applied', 'approved', 'previous'];
const TAB_LABEL: Record<JobsListTab, 'tabFeed' | 'tabApplied' | 'tabApproved' | 'tabPrevious'> = {
  feed: 'tabFeed',
  applied: 'tabApplied',
  approved: 'tabApproved',
  previous: 'tabPrevious',
};

export function WorkerJobsListScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyInstantApproval, setOnlyInstantApproval] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<FeedSort>('start');
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [sectorCode, setSectorCode] = useState<string | null>(null);
  const [occupationCode, setOccupationCode] = useState<string | null>(null);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [sectorQuery, setSectorQuery] = useState('');
  const [tab, setTab] = useState<JobsListTab>('feed');
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [pastShifts, setPastShifts] = useState<ShiftItem[]>([]);

  useEffect(() => {
    void fetchJobCatalog()
      .then((catalog) => setSectors(catalog.sectors ?? []))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (tab === 'feed') {
        const data = await fetchJobFeed(token, {
          sectorCode: sectorCode ?? undefined,
          occupationCode: occupationCode ?? undefined,
          onlyFavorites,
          onlyInstantApproval,
        });
        setItems(data.items ?? []);
        setApplications([]);
        setPastShifts([]);
      } else if (tab === 'previous') {
        const data = await listMyShifts(token);
        const allowed = new Set(jobsListTabStatuses(tab));
        setPastShifts((data.items ?? []).filter((shift) => allowed.has(shift.status)));
        setItems([]);
        setApplications([]);
      } else {
        const data = await listMyApplications(token);
        const allowed = new Set(jobsListTabStatuses(tab));
        setApplications((data.items ?? []).filter((row) => allowed.has(row.status)));
        setItems([]);
        setPastShifts([]);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [occupationCode, onlyFavorites, onlyInstantApproval, sectorCode, t, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setQuery(route.params?.query ?? '');
  }, [route.params?.query]);

  const shown = useMemo(() => {
    const sorted = sortFeed(items, sort);
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return sorted;
    }
    return sorted.filter((job) => {
      const title = (job.title ?? '').toLocaleLowerCase('tr-TR');
      const branch = (job.branchName ?? '').toLocaleLowerCase('tr-TR');
      return title.includes(needle) || branch.includes(needle);
    });
  }, [items, query, sort]);
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownApps = applications.filter((item) => {
    if (!needle) {
      return true;
    }
    const title = (item.jobTitle ?? '').toLocaleLowerCase('tr-TR');
    const branch = (item.branchName ?? '').toLocaleLowerCase('tr-TR');
    return title.includes(needle) || branch.includes(needle);
  });
  const shownPast = pastShifts.filter((shift) => {
    if (!needle) {
      return true;
    }
    const title = (shift.jobTitle ?? '').toLocaleLowerCase('tr-TR');
    const branch = (shift.branchName ?? '').toLocaleLowerCase('tr-TR');
    return title.includes(needle) || branch.includes(needle);
  });
  const listedCount =
    tab === 'feed'
      ? shown.length
      : tab === 'previous'
        ? shownPast.length
        : shownApps.length;
  const sectorNeedle = sectorQuery.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = sectorNeedle
    ? sectors.filter((sector) =>
        (sector.displayName ?? '').toLocaleLowerCase('tr-TR').includes(sectorNeedle),
      )
    : sectors;
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

  return (
    <ModulePage
      title={t('worker:jobs.title')}
      testID="m.worker.jobs.list"
      dock
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      <View className="mt-2 flex-row flex-wrap gap-2">
        {TABS.map((value) => (
          <ClayChip
            key={value}
            label={t(`worker:jobs.${TAB_LABEL[value]}`)}
            selected={tab === value}
            onPress={() => {
              setTab(value);
              if (value !== 'feed') {
                setView('list');
              }
            }}
          />
        ))}
      </View>
      {tab === 'feed' ? (
      <View className="mt-2 flex-row flex-wrap gap-2">
        {(['list', 'map'] as const).map((mode) => (
          <ClayChip
            key={mode}
            label={mode === 'list' ? t('worker:jobs.viewList') : t('worker:jobs.viewMap')}
            selected={view === mode}
            onPress={() => setView(mode)}
          />
        ))}
        <ClayChip
          label={t('worker:jobs.filterFavorites')}
          selected={onlyFavorites}
          onPress={() => setOnlyFavorites((value) => !value)}
        />
        <ClayChip
          label={t('worker:jobs.filterInstant')}
          selected={onlyInstantApproval}
          onPress={() => setOnlyInstantApproval((value) => !value)}
        />
        {(['start', 'distance', 'pay'] as const).map((value) => (
          <ClayChip
            key={value}
            label={t(
              value === 'start'
                ? 'worker:jobs.sortStart'
                : value === 'distance'
                  ? 'worker:jobs.sortDistance'
                  : 'worker:jobs.sortPay',
            )}
            selected={sort === value}
            onPress={() => setSort(value)}
          />
        ))}
      </View>
      ) : null}
      <View className="mt-3">
        <TextField
          inset
          shape="capsule"
          label={t('worker:jobs.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      {tab === 'feed' && sectors.length > 0 ? (
        <View className="mt-2">
          <TextField
            inset
            shape="capsule"
            label={t('worker:jobs.sectorSearch')}
            onChangeText={setSectorQuery}
            value={sectorQuery}
          />
        </View>
      ) : null}
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t(`worker:jobs.${TAB_LABEL[tab]}`),
              value: String(listedCount),
            },
          ]}
        />
      </View>
      {tab === 'feed' ? (
      <View className="mt-2 flex-row flex-wrap gap-2">
        {shownSectors.map((sector) => (
          <ClayChip
            key={sector.code}
            label={sector.displayName}
            selected={sectorCode === sector.code}
            onPress={() => {
              setOccupationCode(null);
              setSectorCode((current) =>
                current === sector.code ? null : sector.code,
              );
            }}
          />
        ))}
        {(sectors.find((sector) => sector.code === sectorCode)?.occupations ?? []).map(
          (occupation) => (
            <ClayChip
              key={occupation.code}
              label={occupation.title}
              selected={occupationCode === occupation.code}
              tone="accent"
              onPress={() =>
                setOccupationCode((current) =>
                  current === occupation.code ? null : occupation.code,
                )
              }
            />
          ),
        )}
      </View>
      ) : null}
      {loading && listedCount === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {tab === 'applied' || tab === 'approved' ? (
        <View className="mt-4 gap-3">
          {shownApps.map((item) => (
            <JobCard
              key={item.id}
              status={item.status}
              title={item.jobTitle ?? t('worker:jobs.untitled')}
              onPress={() =>
                navigation.navigate('SharedJobProcess', {
                  applicationId: item.id,
                })
              }
            >
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
            </JobCard>
          ))}
          {!loading && applications.length === 0 ? (
            <EmptyState
              title={
                tab === 'applied'
                  ? t('worker:applications.empty')
                  : t('worker:applications.emptyFilter')
              }
            />
          ) : null}
          {!loading && applications.length > 0 && shownApps.length === 0 ? (
            <EmptyState title={t('worker:jobs.searchEmpty')} />
          ) : null}
        </View>
      ) : null}
      {tab === 'previous' ? (
        <View className="mt-4 gap-3">
          {shownPast.map((shift) => (
            <JobCard
              key={shift.id}
              status={shift.status}
              title={
                shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')
              }
              onPress={() =>
                navigation.navigate('WorkerJobDetail', { jobId: shift.jobId })
              }
            >
              <ShiftFacts shift={shift} />
            </JobCard>
          ))}
          {!loading && pastShifts.length === 0 ? (
            <EmptyState title={t('worker:jobs.tabPreviousEmpty')} />
          ) : null}
          {!loading && pastShifts.length > 0 && shownPast.length === 0 ? (
            <EmptyState title={t('worker:jobs.searchEmpty')} />
          ) : null}
        </View>
      ) : null}
      {tab === 'feed' && view === 'map' ? (
        <View className="mt-4 gap-3">
          {pins.length === 0 ? (
            <EmptyState title={t('worker:jobs.mapEmpty')} />
          ) : (
            <JobsMap
              pins={pins.map((job) => ({
                id: job.id,
                title: job.title ?? job.branchName ?? t('worker:jobs.untitled'),
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
              <JobCard
                key={job.id}
                title={job.title ?? job.branchName ?? t('worker:jobs.untitled')}
                onPress={() =>
                  navigation.navigate('WorkerJobDetail', { jobId: job.id })
                }
              >
                <JobFacts
                  branchName={job.branchName}
                  startsAt={job.startsAt}
                  endsAt={job.endsAt}
                  payAmountMinor={job.payAmountMinor}
                  payCurrency={job.payCurrency}
                  distanceKm={job.distanceKm}
                  headcount={job.headcount}
                  remainingHeadcount={job.remainingHeadcount}
                  favoritesOnly={job.favoritesOnly}
                  instantAutoApprove={job.instantAutoApprove}
                  matchReasons={job.matchReasons}
                />
              </JobCard>
            ))}
        </View>
      ) : tab === 'feed' ? (
        <View className="mt-4 gap-3">
          {shown.map((job) => (
            <JobCard
              key={job.id}
              title={job.title ?? job.branchName ?? t('worker:jobs.untitled')}
              onPress={() =>
                navigation.navigate('WorkerJobDetail', { jobId: job.id })
              }
            >
              <JobFacts
                branchName={job.branchName}
                startsAt={job.startsAt}
                endsAt={job.endsAt}
                payAmountMinor={job.payAmountMinor}
                payCurrency={job.payCurrency}
                distanceKm={job.distanceKm}
                headcount={job.headcount}
                remainingHeadcount={job.remainingHeadcount}
                favoritesOnly={job.favoritesOnly}
                instantAutoApprove={job.instantAutoApprove}
                matchReasons={job.matchReasons}
              />
            </JobCard>
          ))}
          {!loading && items.length === 0 ? (
            <EmptyState title={t('worker:jobs.empty')} />
          ) : null}
          {!loading && items.length > 0 && shown.length === 0 ? (
            <EmptyState title={t('worker:jobs.searchEmpty')} />
          ) : null}
        </View>
      ) : null}
    </ModulePage>
  );
}
