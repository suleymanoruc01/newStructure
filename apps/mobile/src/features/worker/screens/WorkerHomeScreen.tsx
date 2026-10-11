import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Shift } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { workerShiftRoute } from '../../../app/navigation/dock-routes';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { statusLabelTr } from '@parton/api-contracts';
import { ApiClientError } from '../../../api/client';
import { listMyShifts } from '../../../api/shifts-api';
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

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerHome'>;

export function WorkerHomeScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors', 'system']);
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

  const shown = items.filter(
    (shift) => istanbulDayKey(shift.startsAt, timeZone) === day,
  );
  const eyebrow = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${day}T12:00:00.000Z`));

  return (
    <Screen bleed dock scroll testID="m.worker.home.root">
      <HeroModule eyebrow={eyebrow} title={t('worker:home.title')}>
        <DayStrip
          days={weekDayKeys(new Date(), timeZone)}
          onSelect={setSelected}
          selected={day}
          zone={timeZone}
        />
      </HeroModule>
      <SheetModule>
        {error ? (
          <Text className="font-sans mb-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        {loading ? (
          <Text className="font-sans mb-4 text-text-medium">{t('common:loading')}</Text>
        ) : null}
        <View className="gap-3">
          {shown.map((shift) => {
            const destination = workerShiftRoute(shift.status);
            return (
              <Pressable
                key={shift.id}
                accessibilityRole="button"
                className="rounded-lg bg-surface-1 p-4"
                disabled={!destination}
                onPress={() => {
                  if (
                    destination === 'WorkerShiftAvailability' ||
                    destination === 'WorkerShiftCheckIn' ||
                    destination === 'WorkerShiftInShift'
                  ) {
                    navigation.navigate(destination, { shiftId: shift.id });
                  }
                }}
              >
                <Text className="font-sans text-lg font-semibold text-text-high">
                  {shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')}
                </Text>
                <Text className="font-sans mt-1 text-sm text-text-medium">
                  {formatIstanbul(shift.startsAt, timeZone)}
                </Text>
                <Text className="font-sans mt-1 text-sm text-text-low">
                  {statusLabelTr(shift.status)}
                </Text>
              </Pressable>
            );
          })}
          {!loading && shown.length === 0 ? (
            <Text className="font-sans text-text-medium">{t('worker:home.empty')}</Text>
          ) : null}
        </View>
      </SheetModule>
    </Screen>
  );
}
