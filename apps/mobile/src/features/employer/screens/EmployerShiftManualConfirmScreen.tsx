import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { manualConfirmShift } from '../../../api/shifts-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerShiftManualConfirm'
>;

export function EmployerShiftManualConfirmScreen({ route, navigation }: Props) {
  const { shiftId, jobTitle, workerDisplayName, disputeNote } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await manualConfirmShift(shiftId, token, `manual-${shiftId}`);
      navigation.navigate('EmployerOpenDisputes');
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
    <Screen scroll testID="m.employer.shift.manual-confirm">
      <Text className="text-xl font-bold text-text-high">
        {t('employer:manualConfirm.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('employer:manualConfirm.lead')}
      </Text>
      {jobTitle ? (
        <Text className="mt-4 text-base text-text-high">{jobTitle}</Text>
      ) : null}
      {workerDisplayName ? (
        <Text className="mt-1 text-sm text-text-medium">{workerDisplayName}</Text>
      ) : null}
      {disputeNote ? (
        <Text className="mt-4 rounded-xl bg-surface-1 p-3 text-sm text-text-medium">
          {disputeNote}
        </Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onConfirm()}
        testID="ManualConfirmButton"
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('employer:manualConfirm.cta')}
        </Text>
      </Pressable>
    </Screen>
  );
}
