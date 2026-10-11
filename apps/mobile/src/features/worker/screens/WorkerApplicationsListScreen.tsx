import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { listMyApplications } from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerApplicationsList'
>;

export function WorkerApplicationsListScreen(_props: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listMyApplications>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listMyApplications(token);
      setItems(data.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ModulePage title={t('worker:applications.title')} testID="m.worker.applications.list" scroll>
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((item) => (
          <View key={item.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="font-sans font-semibold text-text-high">
              {item.jobTitle ?? t('worker:jobs.untitled')}
            </Text>
            <Text className="font-sans mt-2 text-sm text-text-medium">
              {statusLabelTr(item.status)}
            </Text>
            {item.jobStartsAt ? (
              <Text className="font-sans mt-1 text-xs text-text-low">
                {formatIstanbul(item.jobStartsAt, timeZone)}
              </Text>
            ) : null}
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">
            {t('worker:applications.empty')}
          </Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
