import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { listEmployerJobs } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerJobsList'>;

export function EmployerJobsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [items, setItems] = useState<
    { id: string; status: string; title: string | null }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const jobs = await listEmployerJobs(token);
      setItems(
        jobs.items.map((j) => ({
          id: j.id,
          status: j.status,
          title: j.title ?? null,
        })),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ModulePage title={t('employer:jobs.title')} testID="m.employer.jobs.list" scroll dock>
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('employer:jobs.create')}
          onPress={() => navigation.navigate('EmployerCreateJob')}
        />
      </View>
      <View className="mt-6 gap-3">
        {items.map((job) => (
          <Pressable
            key={job.id}
            accessibilityRole="button"
            className="rounded-lg bg-surface-1 p-4"
            onPress={() =>
              navigation.navigate('EmployerJobDetail', { jobId: job.id })
            }
          >
            <Text className="font-sans text-lg font-semibold text-text-high">
              {job.title ?? job.id}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {statusLabelTr(job.status)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ModulePage>
  );
}
