import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { checkOutFromShift } from '../../../api/shifts-api';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerShiftCheckOut'
>;

export function WorkerShiftCheckOutScreen({ route, navigation }: Props) {
  const { shiftId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCheckOut = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await checkOutFromShift(
        shiftId,
        token,
        { notes: notes.trim() || undefined },
        `checkout-${shiftId}`,
      );
      navigation.navigate('SharedRatingsPending');
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
    <Screen scroll testID="m.worker.shift.check-out">
      <Text className="text-xl font-bold text-text-high">
        {t('worker:shift.checkOutTitle')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:shift.checkOutLead')}
      </Text>
      <TextField
        label={t('worker:shift.checkOutNotes')}
        multiline
        numberOfLines={4}
        onChangeText={setNotes}
        value={notes}
      />
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onCheckOut()}
        testID="CheckOutButton"
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('worker:shift.checkOutConfirm')}
        </Text>
      </Pressable>
    </Screen>
  );
}
