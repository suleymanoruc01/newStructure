import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchShift } from '../../../api/shifts-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftInShift'>;

export function WorkerShiftInShiftScreen({ route, navigation }: Props) {
  const { shiftId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const shift = await fetchShift(shiftId, token);
        setJobTitle(shift.jobTitle ?? null);
        setCheckedInAt(shift.checkedInAt ?? null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      }
    })();
  }, [shiftId, t]);

  return (
    <ModulePage title={t('worker:shift.inShiftTitle')} testID="m.worker.shift.in-shift" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:shift.inShiftLead')}
      </Text>
      {jobTitle ? (
        <Text className="font-sans mt-4 text-base font-semibold text-text-high">
          {jobTitle}
        </Text>
      ) : null}
      {checkedInAt ? (
        <Text className="font-sans mt-2 text-sm text-text-low">
          {t('worker:shift.checkedInAt', {
            time: formatIstanbul(checkedInAt, timeZone),
          })}
        </Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-lg bg-action-primary px-4 py-3"
        onPress={() =>
          navigation.navigate('WorkerShiftCheckOut', { shiftId })
        }
        testID="CheckOutNavigateButton"
      >
        <Text className="font-sans text-center text-base font-semibold text-text-on">
          {t('worker:shift.checkOutCta')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
