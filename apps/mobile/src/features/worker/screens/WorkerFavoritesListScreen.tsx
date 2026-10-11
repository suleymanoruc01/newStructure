import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { listFavorites } from '../../../api/favorites-api';
import { ApiClientError } from '../../../api/client';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerFavoritesList'>;

export function WorkerFavoritesListScreen(_props: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listFavorites>>['items']
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
      const data = await listFavorites(token);
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
    <ModulePage title={t('worker:favorites.title')} testID="m.worker.favorites.list" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:favorites.lead')}
      </Text>
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((item) => (
          <View key={item.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="font-sans font-semibold text-text-high">
              {item.type === 'employer'
                ? t('worker:favorites.employer')
                : t('worker:favorites.worker')}
            </Text>
            <Text className="font-sans mt-1 text-xs text-text-low">{item.targetId}</Text>
            {item.mutual ? (
              <Text className="font-sans mt-2 text-sm text-brand-accent">
                {t('worker:favorites.mutual')}
              </Text>
            ) : null}
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">{t('worker:favorites.empty')}</Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
