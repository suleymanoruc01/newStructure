import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { listWorkerDocuments } from '../../../api/worker-documents-api';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
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
    <ModulePage title={t('worker:documents.title')} testID="m.worker.documents.list" scroll>
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('worker:documents.uploadCta')}
          onPress={() => navigation.navigate('WorkerDocumentsUpload')}
        />
      </View>
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((doc) => (
          <View key={doc.id} className="rounded-2xl bg-surface-1 p-4">
            <Text className="font-sans font-semibold text-text-high">
              {t(`worker:documents.types.${doc.documentType}`)}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">{doc.fileName}</Text>
            <Text className="font-sans mt-1 text-xs text-text-low">
              {statusLabelTr(doc.status)}
            </Text>
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">{t('worker:documents.empty')}</Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
