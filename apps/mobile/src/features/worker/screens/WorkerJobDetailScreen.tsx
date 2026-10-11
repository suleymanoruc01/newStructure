import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { ApiClientError } from '../../../api/client';
import { fetchJobDetail } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobDetail'>;

export function WorkerJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchJobDetail>
  > | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
        }
        const data = await fetchJobDetail(jobId, token);
        setDetail(data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      }
    })();
  }, [jobId, t]);

  return (
    <Screen scroll testID="m.worker.jobs.detail">
      {detail ? (
        <View>
          <Text className="text-2xl font-bold text-text-high">
            {detail.title ?? detail.branchName ?? t('worker:jobs.untitled')}
          </Text>
          <Text className="mt-2 text-base text-text-medium">
            {new Date(detail.startsAt).toLocaleString('tr-TR')} –{' '}
            {new Date(detail.endsAt).toLocaleString('tr-TR')}
          </Text>
          {detail.eligibility ? (
            <View className="mt-4">
              <Text className="text-base text-text-high">
                {detail.eligibility.eligible
                  ? t('worker:jobs.eligible')
                  : t('worker:jobs.notEligible')}
              </Text>
              {!detail.eligibility.eligible &&
              detail.eligibility.reasons.length > 0 ? (
                <Text className="mt-2 text-sm text-text-medium">
                  {detail.eligibility.reasons.join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}
          {detail.matchReasons && detail.matchReasons.length > 0 ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-text-high">
                {t('worker:jobs.matchReasonsTitle')}
              </Text>
              <Text className="mt-1 text-sm text-text-medium">
                {detail.matchReasons
                  .map((reason) =>
                    t(`worker:jobs.matchReasons.${reason}`, {
                      defaultValue: reason,
                    }),
                  )
                  .join(' · ')}
              </Text>
            </View>
          ) : null}
          {detail.eligibility?.eligible ? (
            <View className="mt-6">
              <Button
                label={t('worker:jobs.apply')}
                onPress={() =>
                  navigation.navigate('WorkerJobApply', { jobId })
                }
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </Screen>
  );
}
