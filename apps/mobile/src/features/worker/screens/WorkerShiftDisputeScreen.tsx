import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { createShiftDispute, fetchShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { Button } from '../../../components/ui/Button';
import { ClayChip } from '../../../components/ui/ClayChip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftDispute'>;

export function WorkerShiftDisputeScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState<Awaited<
    ReturnType<typeof fetchShift>
  > | null>(null);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      setShift(await fetchShift(shiftId, token));
    })();
  }, [shiftId]);

  const onSubmit = async () => {
    const trimmed = note.trim();
    if (trimmed.length < 10) {
      setError(t('worker:dispute.noteTooShort'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await createShiftDispute(shiftId, token, { note: trimmed });
      navigation.popToTop();
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
    <ModulePage title={t('worker:dispute.title')} testID="m.worker.shift.dispute" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:dispute.lead')}
      </Text>
      {shift ? (
        <View className="mt-3">
          <JobCard
            status={shift.status}
            title={shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')}
          >
            <ShiftFacts shift={shift} />
          </JobCard>
        </View>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {(
          [
            t('worker:dispute.chipGeofence'),
            t('worker:dispute.chipGps'),
            t('worker:dispute.chipLate'),
          ] as const
        ).map((label) => (
          <ClayChip
            key={label}
            label={label}
            selected={note === label}
            onPress={() => setNote(label)}
          />
        ))}
      </View>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('worker:dispute.noteLabel'),
              value: String(note.trim().length),
            },
          ]}
        />
      </View>
      <View className="mt-3">
        <StatusBadge
          label={
            note.trim().length >= 10
              ? t('worker:dispute.submit')
              : t('worker:dispute.noteTooShort')
          }
          tone={note.trim().length >= 10 ? 'strong' : 'warn'}
        />
      </View>
      <TextField
        label={t('worker:dispute.noteLabel')}
        multiline
        numberOfLines={5}
        onChangeText={setNote}
        value={note}
      />
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('worker:dispute.submit')}
        onPress={() => void onSubmit()}
        testID="DisputeSubmitButton"
      />
    </ModulePage>
  );
}
