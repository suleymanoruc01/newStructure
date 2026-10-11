import type { AvailabilityWindowInput } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import {
  fetchWorkerAvailability,
  putWorkerAvailability,
} from '../../../api/workers-api';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import {
  DAY_NAMES_TR,
  formatMinuteOfDay,
  parseTimeToMinute,
} from '../../../shared/availability/time-minutes';
import { getAccessToken } from '../../../shared/auth/session-memory';

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
  const [newDay, setNewDay] = useState('1');
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
      setWindows(data.windows.map(toEditable));
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
      if (err instanceof ApiClientError) {
        if (err.code === 'AVAILABILITY_OVERLAP') {
          setError(t('worker:availability.overlapError'));
        } else {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        }
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID="m.worker.availability.edit">
      <Text className="text-2xl font-bold text-text-high">
        {t('worker:availability.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:availability.lead')}
      </Text>
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      <View className="mt-4 gap-2">
        {windows.map((w) => (
          <View
            key={w.key}
            className="flex-row items-center justify-between rounded-xl bg-surface-1 p-3"
          >
            <View className="flex-1">
              <Text className="font-semibold text-text-high">
                {DAY_NAMES_TR[w.dayOfWeek]}
              </Text>
              <Text className="text-sm text-text-medium">
                {formatMinuteOfDay(w.startMinute)} –{' '}
                {formatMinuteOfDay(w.endMinute)}
                {w.crossesMidnight ? ` (${t('worker:availability.overnight')})` : ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onRemove(w.key)}
            >
              <Text className="text-sm font-semibold text-feedback-error">
                {t('worker:availability.remove')}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View className="mt-6 gap-2 rounded-xl border border-surface-2 p-4">
        <Text className="font-semibold text-text-high">
          {t('worker:availability.addTitle')}
        </Text>
        <TextField
          label={t('worker:availability.dayOfWeek')}
          value={newDay}
          onChangeText={setNewDay}
          keyboardType="number-pad"
        />
        <Text className="text-xs text-text-low">
          {t('worker:availability.dayHint')}
        </Text>
        <TextField
          label={t('worker:availability.startTime')}
          value={newStart}
          onChangeText={setNewStart}
        />
        <TextField
          label={t('worker:availability.endTime')}
          value={newEnd}
          onChangeText={setNewEnd}
        />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: newCrossesMidnight }}
          className="flex-row items-center justify-between py-2"
          onPress={() => setNewCrossesMidnight((v) => !v)}
        >
          <Text className="text-sm text-text-high">
            {t('worker:availability.crossesMidnight')}
          </Text>
          <Text className="text-sm font-semibold text-brand-primary">
            {newCrossesMidnight ? t('common:yes') : t('common:no')}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-xl bg-surface-1 px-4 py-3"
          onPress={() => onAddWindow()}
        >
          <Text className="text-center font-semibold text-text-high">
            {t('worker:availability.addWindow')}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onSave()}
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('worker:availability.save')}
        </Text>
      </Pressable>
    </Screen>
  );
}
