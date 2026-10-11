import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { checkOutFromShift } from '../../../api/shifts-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
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
    <ModulePage title={t('worker:shift.checkOutTitle')} testID="m.worker.shift.check-out" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
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
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-lg bg-action-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onCheckOut()}
        testID="CheckOutButton"
      >
        <Text className="font-sans text-center text-base font-semibold text-text-on">
          {submitting ? t('common:loading') : t('worker:shift.checkOutConfirm')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
