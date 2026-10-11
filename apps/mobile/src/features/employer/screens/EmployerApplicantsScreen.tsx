import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { statusLabelTr } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import {
  acceptApplication,
  listJobApplications,
} from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerApplicants'>;

export function EmployerApplicantsScreen({ route, navigation }: Props) {
  const { jobId, jobTitle } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors', 'system']);
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
    <ModulePage title={jobTitle ?? t('employer:applicants.title')} testID="m.employer.applicants.list" scroll={false}>
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="font-sans text-text-medium">{t('employer:applicants.empty')}</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-lg bg-surface-1 p-4">
              <Text className="font-sans text-base font-semibold text-text-high">
                {item.workerDisplayName ??
                  `${item.profileSnapshot.firstName ?? ''} ${item.profileSnapshot.lastName ?? ''}`.trim()}
              </Text>
              <Text className="font-sans mt-1 text-sm text-text-medium">
                {statusLabelTr(item.status)}
              </Text>
              {item.status === 'pending' ? (
                <Pressable
                  className="mt-3 rounded-lg bg-action-primary px-3 py-2"
                  onPress={() => void onAccept(item.id)}
                >
                  <Text className="font-sans text-center text-sm font-semibold text-text-on">
                    {t('employer:applicants.accept')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}
    </ModulePage>
  );
}
