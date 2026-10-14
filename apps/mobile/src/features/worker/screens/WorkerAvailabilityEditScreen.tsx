import type { AvailabilityWindowInput } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ClayChip } from '../../../components/ui/ClayChip';
import { clayCard } from '../../../components/ui/clay';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import {
  fetchWorkerAvailability,
  putWorkerAvailability,
} from '../../../api/workers-api';
import { AvailabilityWeekGrid } from '../../../components/availability/AvailabilityWeekGrid';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { NativeTimeRangePicker } from '../../../components/ui/NativeTimeRangePicker';
import {
  AVAIL_HOURS,
  DAY_NAMES_TR,
  formatMinuteOfDay,
  parseTimeToMinute,
} from '../../../shared/availability/time-minutes';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { weekdaySun0 } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerAvailabilityEdit'
>;

type EditableWindow = AvailabilityWindowInput & { key: string };

function toEditable(w: AvailabilityWindowInput, index: number): EditableWindow {
  return { ...w, key: `w-${index}-${w.dayOfWeek}-${w.startMinute}` };
}

export function WorkerAvailabilityEditScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [windows, setWindows] = useState<EditableWindow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const todayDow = weekdaySun0();
  const [newDay, setNewDay] = useState(String(todayDow));
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [newCrossesMidnight, setNewCrossesMidnight] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchWorkerAvailability(token);
      setWindows((data.windows ?? []).map(toEditable));
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAddWindow = () => {
    try {
      const dayOfWeek = Number.parseInt(newDay, 10);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new ApiClientError(
          t('worker:availability.invalidDay'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const startMinute = parseTimeToMinute(newStart);
      const endMinute = parseTimeToMinute(newEnd);
      const crossesMidnight =
        newCrossesMidnight || endMinute <= startMinute;
      setWindows((prev) => [
        ...prev,
        toEditable(
          {
            dayOfWeek,
            startMinute,
            endMinute,
            crossesMidnight,
          },
          prev.length,
        ),
      ]);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      }
    }
  };

  const onRemove = (key: string) => {
    setWindows((prev) => prev.filter((w) => w.key !== key));
  };

  const onSave = async () => {
    if (windows.length === 0) {
      setError(t('worker:availability.empty'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await putWorkerAvailability(
        {
          windows: windows.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startMinute: w.startMinute,
            endMinute: w.endMinute,
            crossesMidnight: w.crossesMidnight,
          })),
        },
        token,
      );
      navigation.goBack();
    } catch (err) {
      setError(
        err instanceof ApiClientError && err.code === 'AVAILABILITY_OVERLAP'
          ? t('worker:availability.overlapError')
          : formErrorMessage(err, t),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage title={t('worker:availability.title')} testID="m.worker.availability.edit" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:availability.lead')}
      </Text>
      {loading && windows.length === 0 ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      <View className="mt-4">
        <AvailabilityWeekGrid
          markedDays={[...new Set(windows.map((window) => window.dayOfWeek))]}
          selectedDay={
            Number.isInteger(Number.parseInt(newDay, 10))
              ? Number.parseInt(newDay, 10)
              : 1
          }
          onSelect={(day) => setNewDay(String(day))}
        />
      </View>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('worker:calendar.today'),
              value: String(
                windows.filter((window) => window.dayOfWeek === todayDow)
                  .length,
              ),
            },
            {
              label: t('worker:availability.statWindows'),
              value: String(windows.length),
            },
          ]}
        />
      </View>
      <View className="mt-4 gap-2">
        {windows.map((w) => (
          <JobCard key={w.key} title={DAY_NAMES_TR[w.dayOfWeek]}>
            {w.dayOfWeek === todayDow ? (
              <StatusBadge label={t('worker:calendar.today')} tone="strong" />
            ) : null}
            <Text className="font-sans text-sm text-text-medium">
              {formatMinuteOfDay(w.startMinute)} –{' '}
              {formatMinuteOfDay(w.endMinute)}
            </Text>
            {w.crossesMidnight ? (
              <StatusBadge
                label={t('worker:availability.overnight')}
                tone="warn"
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              className="mt-2 self-start"
              onPress={() => onRemove(w.key)}
            >
              <Text className="font-sans text-sm font-semibold text-feedback-error">
                {t('worker:availability.remove')}
              </Text>
            </Pressable>
          </JobCard>
        ))}
      </View>
      <NativeTimeRangePicker
        label={t('worker:availability.addTitle')}
        startTime={newStart}
        endTime={newEnd}
        crossesMidnight={newCrossesMidnight}
        onChange={({ startTime, endTime, crossesMidnight }) => {
          setNewStart(startTime);
          setNewEnd(endTime);
          setNewCrossesMidnight(crossesMidnight);
        }}
      />
      <View className="mt-3">
        <Button
          label={t('worker:availability.addWindow')}
          onPress={() => onAddWindow()}
          variant="secondary"
        />
      </View>

      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-8">
        <Button
          disabled={submitting}
          label={submitting ? t('common:loading') : t('worker:availability.save')}
          onPress={() => void onSave()}
        />
      </View>
    </ModulePage>
  );
}
