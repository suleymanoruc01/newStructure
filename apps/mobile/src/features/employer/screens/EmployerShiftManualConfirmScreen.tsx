import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchShift, manualConfirmShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerShiftManualConfirm'
>;

export function EmployerShiftManualConfirmScreen({ route, navigation }: Props) {
  const { shiftId, jobTitle, workerDisplayName, disputeNote } = route.params ?? {
    shiftId: '',
    jobTitle: null,
    workerDisplayName: null,
  };
  const { t } = useTranslation(['employer', 'common', 'errors']);
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
      try {
        setShift(await fetchShift(shiftId, token));
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      }
    })();
  }, [shiftId, t]);

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
    <ModulePage title={t('employer:manualConfirm.title')} testID="m.employer.shift.manual-confirm" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('employer:manualConfirm.lead')}
      </Text>
      <View className="mt-4">
        <JobCard
          title={workerDisplayName || t('employer:disputes.unknownWorker')}
        >
          <StatusBadge
            label={t('employer:disputes.title')}
            tone="warn"
          />
          {jobTitle ? (
            <Text className="font-sans text-sm text-text-high">{jobTitle}</Text>
          ) : null}
          {shift ? (
            <View className="mt-2">
              <ShiftFacts shift={shift} />
            </View>
          ) : (
            <View className="mt-2">
              <SkeletonList rows={1} />
            </View>
          )}
          {disputeNote ? (
            <Text className="font-sans mt-2 text-sm text-text-medium">
              {disputeNote}
            </Text>
          ) : null}
        </JobCard>
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('employer:manualConfirm.cta')}
        onPress={() => void onConfirm()}
        testID="ManualConfirmButton"
      />
    </ModulePage>
  );
}
