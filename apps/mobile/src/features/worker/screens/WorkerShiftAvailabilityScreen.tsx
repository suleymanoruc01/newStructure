import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { confirmAvailability, fetchShift } from '../../../api/shifts-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerShiftAvailability'
>;

export function WorkerShiftAvailabilityScreen({ route, navigation }: Props) {
  const { shiftId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const shift = await fetchShift(shiftId, token);
      setTitle(shift.jobTitle ?? shift.branchName ?? null);
    })();
  }, [shiftId]);

  const onDecision = async (decision: 'can_come' | 'cannot_come') => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await confirmAvailability(shiftId, token, { decision });
      if (decision === 'can_come') {
        navigation.replace('WorkerShiftCheckIn', { shiftId });
      } else {
        navigation.popToTop();
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID="m.worker.shift.availability-confirm">
      <Text className="text-xl font-bold text-text-high">
        {t('worker:shift.availabilityTitle')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:shift.availabilityLead')}
      </Text>
      {title ? (
        <Text className="mt-2 text-base text-text-medium">{title}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-8 gap-3">
        <Pressable
          className="rounded-xl bg-brand-primary px-4 py-3"
          disabled={submitting}
          onPress={() => void onDecision('can_come')}
        >
          <Text className="text-center font-semibold text-white">
            {t('worker:shift.canCome')}
          </Text>
        </Pressable>
        <Pressable
          className="rounded-xl border border-border-subtle px-4 py-3"
          disabled={submitting}
          onPress={() => void onDecision('cannot_come')}
        >
          <Text className="text-center font-semibold text-text-high">
            {t('worker:shift.cannotCome')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
