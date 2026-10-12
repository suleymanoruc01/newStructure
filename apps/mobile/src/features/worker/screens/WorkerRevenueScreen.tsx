import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Shift } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { listMyShifts } from '../../../api/shifts-api';
import { ApiClientError } from '../../../api/client';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { durationHours } from '../../../shared/datetime/countdown';
import {
  groupRevenueByBranch,
  groupRevenueByTitle,
} from '../../../shared/revenue/group-by-branch';
import { formatPayTry } from '../../../shared/format/pay';
import {
  istanbulDayKey,
  useDisplayTimeZone,
  weekDayKeys,
} from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerRevenue'>;
type Range = 'all' | 'week' | 'month';

export function WorkerRevenueScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<Shift[]>([]);
  const [range, setRange] = useState<Range>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listMyShifts(token);
      setItems(data.items.filter((shift) => shift.status === 'completed'));
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

  const week = new Set(weekDayKeys(new Date(), timeZone));
  const monthKey = istanbulDayKey(new Date(), timeZone).slice(0, 7);
  const shown = items.filter((shift) => {
    const day = istanbulDayKey(shift.startsAt, timeZone);
    switch (range) {
      case 'week':
        return week.has(day);
      case 'month':
        return day.startsWith(monthKey);
      case 'all':
        return true;
      default: {
        const unreachable: never = range;
        return unreachable;
      }
    }
  });
  const totalHours = shown.reduce(
    (sum, shift) => sum + (durationHours(shift.startsAt, shift.endsAt) ?? 0),
    0,
  );
  const totalPay = formatPayTry(
    shown.reduce((sum, shift) => sum + (shift.payAmountMinor ?? 0), 0),
  );
  const untitled = t('worker:jobs.untitled');
  const byBranch = groupRevenueByBranch(shown, durationHours, untitled);
  const byTitle = groupRevenueByTitle(shown, durationHours, untitled);

  return (
    <ModulePage
      title={t('worker:revenue.title')}
      testID="m.worker.revenue.root"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {(['all', 'week', 'month'] as const).map((value) => (
          <Pressable
            key={value}
            className={`rounded-full px-3 py-2 ${
              range === value ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => setRange(value)}
          >
            <Text
              className={`font-sans text-sm ${
                range === value ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {t(`worker:revenue.${value === 'all' ? 'all' : value === 'week' ? 'thisWeek' : 'thisMonth'}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-4">
        <StatStrip
          items={[
            {
              label: t('worker:revenue.statPay'),
              value: totalPay ?? '—',
            },
            {
              label: t('worker:revenue.statHours'),
              value: String(totalHours),
            },
            {
              label: t('worker:revenue.statShifts'),
              value: String(shown.length),
            },
          ]}
        />
      </View>
      {byTitle.length > 1 ? (
        <View className="mt-4 gap-2">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('worker:revenue.byRole')}
          </Text>
          {byTitle.map((row) => (
            <JobCard key={`role-${row.label}`} title={row.label}>
              <StatStrip
                items={[
                  {
                    label: t('worker:revenue.statPay'),
                    value: formatPayTry(row.payMinor) ?? '—',
                  },
                  {
                    label: t('worker:revenue.statHours'),
                    value: String(row.hours),
                  },
                ]}
              />
            </JobCard>
          ))}
        </View>
      ) : null}
      {byBranch.length > 1 ? (
        <View className="mt-4 gap-2">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('worker:revenue.byBranch')}
          </Text>
          {byBranch.map((row) => (
            <JobCard key={row.label} title={row.label}>
              <StatStrip
                items={[
                  {
                    label: t('worker:revenue.statPay'),
                    value: formatPayTry(row.payMinor) ?? '—',
                  },
                  {
                    label: t('worker:revenue.statHours'),
                    value: String(row.hours),
                  },
                  {
                    label: t('worker:revenue.statShifts'),
                    value: String(row.count),
                  },
                ]}
              />
            </JobCard>
          ))}
        </View>
      ) : null}
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((shift) => {
          const hours = durationHours(shift.startsAt, shift.endsAt);
          return (
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
              {hours != null ? (
                <Text className="font-sans text-sm text-text-medium">
                  {t('worker:revenue.hours', { hours })}
                </Text>
              ) : null}
              <View className="mt-2">
                <ShiftFacts shift={shift} />
              </View>
            </JobCard>
          );
        })}
        {shown.length === 0 ? (
          <EmptyState title={t('worker:revenue.empty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
