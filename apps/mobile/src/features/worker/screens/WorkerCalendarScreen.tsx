import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AvailabilityWindowInput, Shift } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab, workerShiftRoute } from '../../../app/navigation/dock-routes';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchWorkerCalendar } from '../../../api/workers-api';
import { addEventToCalendar } from '../../../shared/calendar/add-to-calendar';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { durationHours } from '../../../shared/datetime/countdown';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MonthGrid } from '../../../components/ui/MonthGrid';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Pressable } from '../../../components/ui/Pressable';
import { TextField } from '../../../components/ui/TextField';
import { Screen } from '../../../components/ui/Screen';
import { HeroModule, SheetModule } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  countOverlapPairs,
  intervalsOverlap,
  upcomingItems,
} from '../../../shared/calendar/shift-overlap';
import {
  istanbulDayKey,
  monthGridKeys,
  shiftMonthKey,
  useDisplayTimeZone,
  weekdaySun0,
} from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerCalendar'>;

export function WorkerCalendarScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<Shift[]>([]);
  const [windows, setWindows] = useState<AvailabilityWindowInput[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      const data = await fetchWorkerCalendar(token);
      setItems(data.items);
      setWindows(data.windows);
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
  const shown = items
    .filter((shift) => istanbulDayKey(shift.startsAt, timeZone) === day)
    .filter((shift) => {
      if (!needle) {
        return true;
      }
      const title = (shift.jobTitle ?? '').toLocaleLowerCase('tr-TR');
      const branch = (shift.branchName ?? '').toLocaleLowerCase('tr-TR');
      return title.includes(needle) || branch.includes(needle);
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const monthKey = day.slice(0, 7);
  const monthShifts = items.filter(
    (shift) => istanbulDayKey(shift.startsAt, timeZone).startsWith(monthKey),
  );
  const monthHours = monthShifts.reduce(
    (sum, shift) => sum + (durationHours(shift.startsAt, shift.endsAt) ?? 0),
    0,
  );
  const monthConflicts = countOverlapPairs(monthShifts);
  const upcoming = upcomingItems(
    items,
    new Date().toISOString(),
    new Set(shown.map((shift) => shift.id)),
  );
  const marks: Record<string, number> = {};
  for (const shift of items) {
    const key = istanbulDayKey(shift.startsAt, timeZone);
    marks[key] = (marks[key] ?? 0) + 1;
  }
  const availDays = new Set(windows.map((window) => window.dayOfWeek));
  const gridDays = monthGridKeys(new Date(`${day}T12:00:00.000Z`), timeZone);
  const softMarks: Record<string, boolean> = {};
  for (const key of gridDays) {
    if (availDays.has(weekdaySun0(new Date(`${key}T12:00:00.000Z`), timeZone))) {
      softMarks[key] = true;
    }
  }
  const eyebrow = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${day}T12:00:00.000Z`));

  return (
    <Screen
      bleed
      dock
      onRefresh={() => void load()}
      refreshing={loading}
      scroll
      testID="m.worker.calendar.root"
    >
      <HeroModule eyebrow={eyebrow} title={t('worker:calendar.title')} />
      <SheetModule>
        <View className="mb-4">
          <StatStrip
            items={[
              {
                label: t('worker:home.statShifts'),
                value: String(monthShifts.length),
              },
              {
                label: t('worker:calendar.statHours'),
                value: String(monthHours),
              },
              {
                label: t('worker:calendar.statConflicts'),
                value: String(monthConflicts),
              },
              {
                label: t('worker:calendar.statWindows'),
                value: String(windows.length),
              },
            ]}
          />
        </View>
        <View className="mb-3 flex-row justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(shiftMonthKey(day, -1, timeZone))}
          >
            <Text className="font-sans text-sm font-semibold text-action-secondary">
              {t('worker:calendar.prevMonth')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(today)}
          >
            <Text className="font-sans text-sm font-semibold text-action-secondary">
              {t('worker:calendar.today')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(shiftMonthKey(day, 1, timeZone))}
          >
            <Text className="font-sans text-sm font-semibold text-action-secondary">
              {t('worker:calendar.nextMonth')}
            </Text>
          </Pressable>
        </View>
        <MonthGrid
          days={gridDays}
          marks={marks}
          monthKey={monthKey}
          onSelect={setSelected}
          selected={day}
          softMarks={softMarks}
          zone={timeZone}
        />
        <View className="mt-4">
          <Button
            label={t('worker:calendar.availability')}
            onPress={() => navigation.navigate('WorkerAvailabilityEdit')}
          />
        </View>
        {items.length > 0 ? (
          <View className="mt-3">
            <TextField
              inset
              shape="capsule"
              label={t('worker:calendar.search')}
              onChangeText={setQuery}
              value={query}
            />
          </View>
        ) : null}
        {error ? (
          <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        {loading && items.length === 0 ? (
          <View className="mt-4">
            <SkeletonList />
          </View>
        ) : null}
        <View className="mt-4 gap-3">
          <StatusBadge
            label={t('worker:home.count', { count: shown.length })}
            tone={shown.length > 0 ? 'strong' : 'neutral'}
          />
          {shown.map((shift) => {
            const destination = workerShiftRoute(shift.status);
            return (
              <JobCard
                key={shift.id}
                disabled={!destination}
                status={shift.status}
                title={
                  shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')
                }
                onPress={() => {
                  if (!destination) {
                    return;
                  }
                  openInTab(navigation, destination, ['WorkerHome'], {
                    shiftId: shift.id,
                  });
                }}
              >
                <ShiftFacts shift={shift} />
                {shown.some(
                  (other) =>
                    other.id !== shift.id &&
                    intervalsOverlap(
                      shift.startsAt,
                      shift.endsAt,
                      other.startsAt,
                      other.endsAt,
                    ),
                ) ? (
                  <View className="mt-2">
                    <StatusBadge
                      label={t('worker:calendar.overlap')}
                      tone="error"
                    />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  className="mt-3 self-start rounded-full bg-action-secondary px-3 py-2"
                  onPress={() =>
                    void addEventToCalendar({
                      title:
                        shift.jobTitle ??
                        shift.branchName ??
                        t('worker:jobs.untitled'),
                      startsAt: shift.startsAt,
                      endsAt: shift.endsAt,
                      location: shift.branchName ?? undefined,
                    })
                  }
                >
                  <Text className="font-sans text-xs text-text-on">
                    {t('worker:calendar.add')}
                  </Text>
                </Pressable>
              </JobCard>
            );
          })}
          {!loading && shown.length === 0 ? (
            <EmptyState
              title={
                needle
                  ? t('worker:calendar.searchEmpty')
                  : t('worker:calendar.empty')
              }
              actionLabel={
                needle ? undefined : t('worker:calendar.availability')
              }
              onAction={
                needle
                  ? undefined
                  : () => navigation.navigate('WorkerAvailabilityEdit')
              }
            />
          ) : null}
        </View>
        {upcoming.length > 0 ? (
          <View className="mt-6 gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('worker:calendar.upcoming')}
            </Text>
            {upcoming.map((shift) => {
              const destination = workerShiftRoute(shift.status);
              return (
                <JobCard
                  key={shift.id}
                  disabled={!destination}
                  status={shift.status}
                  title={
                    shift.jobTitle ??
                    shift.branchName ??
                    t('worker:jobs.untitled')
                  }
                  onPress={() => {
                    if (!destination) {
                      return;
                    }
                    openInTab(navigation, destination, ['WorkerHome'], {
                      shiftId: shift.id,
                    });
                  }}
                >
                  <ShiftFacts shift={shift} />
                </JobCard>
              );
            })}
          </View>
        ) : null}
      </SheetModule>
    </Screen>
  );
}
