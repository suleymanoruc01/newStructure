import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Shift } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab, workerShiftCtaKey, workerShiftRoute } from '../../../app/navigation/dock-routes';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchJobFeed } from '../../../api/jobs-api';
import { listMyShifts } from '../../../api/shifts-api';
import { Confirm3hCard } from '../../../components/job/Confirm3hCard';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { JobsMap } from '../../../components/map/JobsMap';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { DayStrip, ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import {
  formatTr,
  istanbulDayKey,
  useDisplayTimeZone,
  weekDayKeys,
} from '../../../shared/datetime/istanbul';
import { partitionHomeShifts } from '../../../shared/shifts/partition-home';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerHomeRoot'>;

export function WorkerHomeScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors', 'system']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<Shift[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [feed, setFeed] = useState<
    Awaited<ReturnType<typeof fetchJobFeed>>['items']
  >([]);
  const [query, setQuery] = useState('');
  const today = istanbulDayKey(new Date(), timeZone);
  const day = selected ?? today;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [shifts, jobs] = await Promise.allSettled([
        listMyShifts(token),
        fetchJobFeed(token),
      ]);
      if (shifts.status === 'fulfilled') {
        setItems(shifts.value.items ?? []);
      } else {
        throw shifts.reason;
      }
      if (jobs.status === 'fulfilled') {
        setFeed(jobs.value.items ?? []);
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
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  const shown = items.filter(
    (shift) => istanbulDayKey(shift.startsAt, timeZone) === day,
  );
  const { active, upcoming } = partitionHomeShifts(items);
  const lookingToday = day === today;
  const listed = lookingToday
    ? upcoming
    : shown.filter(
        (shift) =>
          shift.status !== 'checked_in' && shift.status !== 'manual_confirmed',
      );
  const nextShift =
    listed.find((shift) => shift.confirmWindow?.isOpen) ??
    listed.find((shift) => workerShiftRoute(shift.status));
  const rest = listed.filter((shift) => shift.id !== nextShift?.id);
  const mapShift =
    active.find(
      (shift) => shift.branchLatitude != null && shift.branchLongitude != null,
    ) ??
    shown.find(
      (shift) => shift.branchLatitude != null && shift.branchLongitude != null,
    );
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const openJobs = needle
    ? feed.filter((job) => {
        const title = (job.title ?? '').toLocaleLowerCase('tr-TR');
        const branch = (job.branchName ?? '').toLocaleLowerCase('tr-TR');
        return title.includes(needle) || branch.includes(needle);
      })
    : feed;
  const openPins = openJobs.filter(
    (job) => job.branchLatitude != null && job.branchLongitude != null,
  );
  const eyebrow = formatTr(`${day}T12:00:00.000Z`, timeZone, {
    day: 'numeric',
    month: 'long',
  });

  return (
    <ModulePage
      back="off"
      dock
      eyebrow={eyebrow}
      hero={
        <DayStrip
          days={weekDayKeys(new Date(), timeZone)}
          onSelect={setSelected}
          selected={day}
          zone={timeZone}
        />
      }
      onRefresh={() => void load()}
      refreshing={loading}
      testID="m.worker.home.root"
      title={t('worker:home.title')}
    >
        {error ? (
          <Text className="font-sans mb-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        {loading && shown.length === 0 ? (
          <View className="mb-4">
            <SkeletonList rows={2} />
          </View>
        ) : null}
        {mapShift &&
        mapShift.branchLatitude != null &&
        mapShift.branchLongitude != null ? (
          <View className="mb-4">
            <LocationMap
              pin={{
                latitude: mapShift.branchLatitude,
                longitude: mapShift.branchLongitude,
              }}
              pinLabel={mapShift.branchName ?? undefined}
              radiusM={radii?.radiusM}
              softRadiusM={radii?.softRadiusM}
            />
          </View>
        ) : null}
        <View className="mb-4">
          <StatStrip
            items={[
              {
                label: t('worker:home.active'),
                value: String(active.length),
              },
              {
                label: t('worker:home.statShifts'),
                value: String(shown.length),
              },
              {
                label: t('worker:home.statOpen'),
                value: String(feed.length),
              },
            ]}
          />
        </View>
        <View className="mb-4">
          <TextField
            inset
            label={t('worker:jobs.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
        <View className="gap-3">
          {active.length > 0 ? (
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('worker:home.sectionActive')}
            </Text>
          ) : null}
          {active.map((shift) => (
            <NextShiftCard
              key={shift.id}
              shift={shift}
              untitled={t('worker:jobs.untitled')}
              onPress={() => openWorkerShift(navigation, shift)}
            />
          ))}
          {listed.length > 0 ? (
            <Text className="font-sans mt-2 text-sm font-semibold text-text-high">
              {t('worker:home.sectionUpcoming')}
            </Text>
          ) : null}
          {nextShift ? (
            nextShift.confirmWindow?.isOpen ||
            nextShift.status === 'awaiting_confirm' ? (
              <Confirm3hCard
                ctaLabel={t(
                  `worker:home.${workerShiftCtaKey(nextShift.status) ?? 'ctaAvailability'}`,
                )}
                shift={nextShift}
                untitled={t('worker:jobs.untitled')}
                onPress={() => openWorkerShift(navigation, nextShift)}
              />
            ) : (
              <NextShiftCard
                shift={nextShift}
                untitled={t('worker:jobs.untitled')}
                onPress={() => openWorkerShift(navigation, nextShift)}
              />
            )
          ) : null}
          {rest.map((shift) => {
            const destination = workerShiftRoute(shift.status);
            const cta = workerShiftCtaKey(shift.status);
            return (
              <JobCard
                key={shift.id}
                disabled={!destination}
                status={shift.status}
                title={
                  shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')
                }
                onPress={() => openWorkerShift(navigation, shift)}
              >
                {cta ? (
                  <Text className="font-sans text-sm text-text-low">
                    {t(`worker:home.${cta}`)}
                  </Text>
                ) : null}
                <View className="mt-2">
                  <ShiftFacts shift={shift} />
                </View>
              </JobCard>
            );
          })}
          {!loading &&
          active.length === 0 &&
          listed.length === 0 &&
          shown.length === 0 ? (
            <EmptyState
              title={t('worker:home.empty')}
              actionLabel={t('worker:home.seeAllJobs')}
              onAction={() =>
                openInTab(navigation, 'WorkerJobsList', ['WorkerJobs'], {
                  query: query.trim() || undefined,
                })
              }
            />
          ) : null}
        </View>
        {openJobs.length > 0 ? (
          <View className="mt-8 gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('worker:home.openJobs')}
            </Text>
            {openPins.length > 0 ? (
              <JobsMap
                pins={openPins.map((job) => ({
                  id: job.id,
                  title: job.title ?? job.branchName ?? t('worker:jobs.untitled'),
                  latitude: job.branchLatitude!,
                  longitude: job.branchLongitude!,
                }))}
                selectedId={openPins[0]?.id ?? null}
                onSelect={(id) =>
                  openInTab(navigation, 'WorkerJobDetail', ['WorkerJobs'], {
                    jobId: id,
                  })
                }
              />
            ) : null}
            {openJobs.map((job) => (
              <JobCard
                key={job.id}
                title={job.title ?? job.branchName ?? t('worker:jobs.untitled')}
                onPress={() =>
                  openInTab(navigation, 'WorkerJobDetail', ['WorkerJobs'], {
                    jobId: job.id,
                  })
                }
              >
                <JobFacts
                  branchName={job.branchName}
                  startsAt={job.startsAt}
                  endsAt={job.endsAt}
                  payAmountMinor={job.payAmountMinor}
                  payCurrency={job.payCurrency}
                  distanceKm={job.distanceKm}
                  remainingHeadcount={job.remainingHeadcount}
                  headcount={job.headcount}
                  favoritesOnly={job.favoritesOnly}
                  instantAutoApprove={job.instantAutoApprove}
                  matchReasons={job.matchReasons}
                />
              </JobCard>
            ))}
            <Button
              label={t('worker:home.seeAllJobs')}
              variant="secondary"
              onPress={() =>
                openInTab(navigation, 'WorkerJobsList', ['WorkerJobs'], {
                  query: query.trim() || undefined,
                })
              }
            />
          </View>
        ) : needle ? (
          <View className="mt-8">
            <EmptyState
              title={t('worker:jobs.searchEmpty')}
              actionLabel={t('worker:home.seeAllJobs')}
              onAction={() =>
                openInTab(navigation, 'WorkerJobsList', ['WorkerJobs'], {
                  query: query.trim() || undefined,
                })
              }
            />
          </View>
        ) : null}
    </ModulePage>
  );
}

function openWorkerShift(
  navigation: Props['navigation'],
  shift: Shift,
) {
  const destination = workerShiftRoute(shift.status);
  if (
    destination === 'WorkerShiftAvailability' ||
    destination === 'WorkerShiftPrep' ||
    destination === 'WorkerShiftCheckIn' ||
    destination === 'WorkerShiftInShift'
  ) {
    navigation.navigate(destination, { shiftId: shift.id });
  }
}

function NextShiftCard({
  shift,
  untitled,
  onPress,
}: {
  shift: Shift;
  untitled: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('worker');
  const cta = workerShiftCtaKey(shift.status);
  return (
    <JobCard
      status={shift.status}
      title={shift.jobTitle ?? shift.branchName ?? untitled}
      onPress={onPress}
    >
      <ShiftFacts shift={shift} />
      {cta ? (
        <View className="mt-3">
          <Button label={t(`home.${cta}`)} onPress={onPress} />
        </View>
      ) : null}
    </JobCard>
  );
}
