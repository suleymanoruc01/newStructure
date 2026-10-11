import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { listPendingRatings } from '../../../api/ratings-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'SharedRatingsPending'
>;

export function SharedRatingsPendingScreen({ navigation }: Props) {
  const { t } = useTranslation(['ratings', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listPendingRatings>>['items']
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
      const data = await listPendingRatings(token);
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
    <ModulePage title={t('ratings:pending.title')} testID="m.shared.ratings.pending" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('ratings:pending.lead')}
      </Text>
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((item) => (
          <Pressable
            key={item.shiftId}
            accessibilityRole="button"
            className="rounded-2xl bg-surface-1 p-4"
            onPress={() =>
              navigation.navigate('SharedRatingsCompose', {
                shiftId: item.shiftId,
                counterpartLabel: item.counterpartLabel,
                jobTitle: item.jobTitle,
              })
            }
          >
            <Text className="font-sans font-semibold text-text-high">
              {item.jobTitle ?? t('ratings:pending.untitled')}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {item.counterpartLabel}
            </Text>
          </Pressable>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">{t('ratings:pending.empty')}</Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
