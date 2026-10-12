import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { listEmployerOpenDisputes } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  useDisplayTimeZone,
} from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerOpenDisputes'
>;

export function EmployerOpenDisputesScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listEmployerOpenDisputes>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listEmployerOpenDisputes(token);
      setItems(data.items ?? []);
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
  const shown = useMemo(
    () =>
      needle
        ? items.filter((item) => {
            const title = (item.jobTitle ?? '').toLocaleLowerCase('tr-TR');
            const worker = (item.workerDisplayName ?? '').toLocaleLowerCase(
              'tr-TR',
            );
            return title.includes(needle) || worker.includes(needle);
          })
        : items,
    [items, needle],
  );

  return (
    <ModulePage
      title={t('employer:disputes.title')}
      testID="m.employer.disputes.list"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('employer:disputes.lead')}
      </Text>
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('employer:disputes.title'),
                value: String(items.length),
              },
            ]}
          />
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('employer:disputes.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((item) => (
          <JobCard
            key={item.disputeId}
            status={item.status}
            title={item.jobTitle ?? t('employer:disputes.untitledShift')}
            onPress={() =>
              navigation.navigate('EmployerShiftManualConfirm', {
                shiftId: item.shiftId,
                jobTitle: item.jobTitle,
                workerDisplayName: item.workerDisplayName,
                disputeNote: item.note,
              })
            }
          >
            <Text className="font-sans text-sm text-text-medium">
              {item.workerDisplayName ?? t('employer:disputes.unknownWorker')}
            </Text>
            {item.note ? (
              <Text className="font-sans mt-1 text-sm text-text-low">
                {item.note}
              </Text>
            ) : null}
            <Text className="font-sans mt-2 text-xs text-text-low">
              {formatIstanbul(item.createdAt, timeZone)}
            </Text>
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState title={t('employer:disputes.empty')} />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState title={t('employer:disputes.searchEmpty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
