import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import {
  acceptApplication,
  listJobApplications,
} from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerApplicants'>;

export function EmployerApplicantsScreen({ route }: Props) {
  const { jobId, jobTitle } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listJobApplications>>['items']
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listJobApplications(jobId, token, 'pending');
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
  }, [jobId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onAccept = async (applicationId: string) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await acceptApplication(applicationId, token, `accept-${applicationId}`);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  return (
    <Screen testID="m.employer.applicants.list">
      <Text className="text-xl font-bold text-text-high">
        {jobTitle ?? t('employer:applicants.title')}
      </Text>
      {error ? (
        <Text className="mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : (
        <FlatList
          className="mt-4"
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-text-medium">{t('employer:applicants.empty')}</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-border-subtle bg-surface-elevated p-4">
              <Text className="text-base font-semibold text-text-high">
                {item.workerDisplayName ??
                  `${item.profileSnapshot.firstName ?? ''} ${item.profileSnapshot.lastName ?? ''}`.trim()}
              </Text>
              <Text className="mt-1 text-sm text-text-medium">{item.status}</Text>
              {item.status === 'pending' ? (
                <Pressable
                  className="mt-3 rounded-lg bg-brand-primary px-3 py-2"
                  onPress={() => void onAccept(item.id)}
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    {t('employer:applicants.accept')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}
