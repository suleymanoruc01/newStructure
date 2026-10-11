import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { listEmployerOpenDisputes } from '../../../api/shifts-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerOpenDisputes'
>;

export function EmployerOpenDisputesScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listEmployerOpenDisputes>>['items']
  >([]);
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
      const data = await listEmployerOpenDisputes(token);
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

  return (
    <Screen scroll testID="m.employer.disputes.list">
      <Text className="text-2xl font-bold text-text-high">
        {t('employer:disputes.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('employer:disputes.lead')}
      </Text>
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((item) => (
          <Pressable
            key={item.disputeId}
            accessibilityRole="button"
            className="rounded-2xl bg-surface-1 p-4"
            onPress={() =>
              navigation.navigate('EmployerShiftManualConfirm', {
                shiftId: item.shiftId,
                jobTitle: item.jobTitle,
                workerDisplayName: item.workerDisplayName,
                disputeNote: item.note,
              })
            }
          >
            <Text className="font-semibold text-text-high">
              {item.jobTitle ?? t('employer:disputes.untitledShift')}
            </Text>
            <Text className="mt-1 text-sm text-text-medium">
              {item.workerDisplayName ?? t('employer:disputes.unknownWorker')}
            </Text>
            <Text className="mt-2 text-xs text-text-low">{item.note}</Text>
          </Pressable>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="text-text-medium">{t('employer:disputes.empty')}</Text>
        ) : null}
      </View>
    </Screen>
  );
}
