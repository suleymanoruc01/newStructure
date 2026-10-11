import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { fetchJobDetail } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobDetail'>;

export function WorkerJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
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
    <ModulePage title={detail?.title ?? detail?.branchName ?? t('worker:jobs.untitled')} testID="m.worker.jobs.detail" scroll>
      {detail ? (
        <View>
          
          <Text className="font-sans mt-2 text-base text-text-medium">
            {formatIstanbul(detail.startsAt, timeZone)} –{' '}
            {formatIstanbul(detail.endsAt, timeZone)}
          </Text>
          {detail.eligibility ? (
            <View className="mt-4">
              <Text className="font-sans text-base text-text-high">
                {detail.eligibility.eligible
                  ? t('worker:jobs.eligible')
                  : t('worker:jobs.notEligible')}
              </Text>
              {!detail.eligibility.eligible &&
              detail.eligibility.reasons.length > 0 ? (
                <Text className="font-sans mt-2 text-sm text-text-medium">
                  {detail.eligibility.reasons.join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}
          {detail.matchReasons && detail.matchReasons.length > 0 ? (
            <View className="mt-4">
              <Text className="font-sans text-sm font-semibold text-text-high">
                {t('worker:jobs.matchReasonsTitle')}
              </Text>
              <Text className="font-sans mt-1 text-sm text-text-medium">
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
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ModulePage>
  );
}
