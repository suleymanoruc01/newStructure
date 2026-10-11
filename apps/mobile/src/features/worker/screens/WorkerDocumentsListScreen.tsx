import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { listWorkerDocuments } from '../../../api/worker-documents-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerDocumentsList'>;

export function WorkerDocumentsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listWorkerDocuments>>['items']
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
      const data = await listWorkerDocuments(token);
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
    <Screen scroll testID="m.worker.documents.list">
      <Text className="text-2xl font-bold text-text-high">
        {t('worker:documents.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:documents.lead')}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="mt-4 self-start rounded-full bg-brand-primary px-4 py-2"
        onPress={() => navigation.navigate('WorkerDocumentsUpload')}
      >
        <Text className="text-sm font-semibold text-white">
          {t('worker:documents.uploadCta')}
        </Text>
      </Pressable>
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((doc) => (
          <View key={doc.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="font-semibold text-text-high">
              {t(`worker:documents.types.${doc.documentType}`)}
            </Text>
            <Text className="mt-1 text-sm text-text-medium">{doc.fileName}</Text>
            <Text className="mt-1 text-xs text-text-low">
              {t(`worker:documents.status.${doc.status}`)}
            </Text>
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="text-text-medium">{t('worker:documents.empty')}</Text>
        ) : null}
      </View>
    </Screen>
  );
}
