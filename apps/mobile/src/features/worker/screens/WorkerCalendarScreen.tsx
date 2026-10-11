import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Shift } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import { openInTab, workerShiftRoute } from '../../../app/navigation/dock-routes';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { listMyShifts } from '../../../api/shifts-api';
import { Button } from '../../../components/ui/Button';
import { Pressable } from '../../../components/ui/Pressable';
import { Screen } from '../../../components/ui/Screen';
import { DayStrip, HeroModule, SheetModule } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  istanbulDayKey,
  useDisplayTimeZone,
  weekDayKeys,
} from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerCalendar'>;

export function WorkerCalendarScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<Shift[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      const data = await listMyShifts(token);
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

  const shown = items
    .filter((shift) => istanbulDayKey(shift.startsAt, timeZone) === day)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const eyebrow = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${day}T12:00:00.000Z`));

  return (
    <Screen bleed dock scroll testID="m.worker.calendar.root">
      <HeroModule eyebrow={eyebrow} title={t('worker:calendar.title')}>
        <DayStrip
          days={weekDayKeys(new Date(), timeZone)}
          onSelect={setSelected}
          selected={day}
          zone={timeZone}
        />
      </HeroModule>
      <SheetModule>
        <Button
          label={t('worker:calendar.availability')}
          onPress={() => navigation.navigate('WorkerAvailabilityEdit')}
        />
        {error ? (
          <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        {loading ? (
          <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
        ) : null}
        <View className="mt-4 gap-3">
          {shown.map((shift) => {
            const destination = workerShiftRoute(shift.status);
            return (
              <Pressable
                key={shift.id}
                accessibilityRole="button"
                className="rounded-lg bg-surface-1 p-4"
                disabled={!destination}
                onPress={() => {
                  if (!destination) {
                    return;
                  }
                  openInTab(navigation, destination, ['WorkerHome'], {
                    shiftId: shift.id,
                  });
                }}
              >
                <Text className="font-sans text-base font-semibold text-text-high">
                  {shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')}
                </Text>
                <Text className="font-sans mt-1 text-sm text-text-medium">
                  {formatIstanbul(shift.startsAt, timeZone)} · {statusLabelTr(shift.status)}
                </Text>
              </Pressable>
            );
          })}
          {!loading && shown.length === 0 ? (
            <Text className="font-sans text-text-medium">{t('worker:calendar.empty')}</Text>
          ) : null}
        </View>
      </SheetModule>
    </Screen>
  );
}
