import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { createFavorite, listFavorites } from '../../../api/favorites-api';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerFavoriteWorkers'
>;

export function EmployerFavoriteWorkersScreen(_props: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listFavorites>>['items']
  >([]);
  const [workerUserId, setWorkerUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listFavorites(token);
      setItems(data.items.filter((f) => f.type === 'worker'));
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

  const onAdd = async () => {
    const id = workerUserId.trim();
    if (!id) {
      setError(t('employer:favorites.workerIdRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await createFavorite(token, { type: 'worker', id }, `fav-worker-${id}`);
      setWorkerUserId('');
      await load();
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
    <Screen scroll testID="m.employer.favorites.workers">
      <Text className="text-2xl font-bold text-text-high">
        {t('employer:favorites.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('employer:favorites.lead')}
      </Text>
      <View className="mt-4 gap-2">
        <TextField
          label={t('employer:favorites.workerUserId')}
          onChangeText={setWorkerUserId}
          value={workerUserId}
        />
        <Pressable
          accessibilityRole="button"
          className="rounded-xl bg-brand-primary px-4 py-3"
          disabled={submitting}
          onPress={() => void onAdd()}
        >
          <Text className="text-center font-semibold text-white">
            {submitting ? t('common:loading') : t('employer:favorites.add')}
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((fav) => (
          <View key={fav.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="font-semibold text-text-high">
              {t('employer:favorites.workerLabel')}
            </Text>
            <Text className="mt-1 text-xs text-text-low">{fav.targetId}</Text>
            {fav.mutual ? (
              <Text className="mt-2 text-xs text-brand-accent">
                {t('employer:favorites.mutual')}
              </Text>
            ) : null}
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="text-text-medium">{t('employer:favorites.empty')}</Text>
        ) : null}
      </View>
    </Screen>
  );
}
