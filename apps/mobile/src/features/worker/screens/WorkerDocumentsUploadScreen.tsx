import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { pick, types as docTypes } from '@react-native-documents/picker';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WorkerDocumentType } from '@parton/api-contracts';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import {
  completeWorkerDocumentUpload,
  createWorkerDocumentUpload,
  putFileToPresignedUrl,
} from '../../../api/worker-documents-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerDocumentsUpload'>;

const DOCUMENT_TYPES: WorkerDocumentType[] = [
  'id_card',
  'criminal_record',
  'health_report',
  'food_hygiene',
  'drivers_license',
  'other',
];

export function WorkerDocumentsUploadScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [documentType, setDocumentType] =
    useState<WorkerDocumentType>('id_card');
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedMime, setPickedMime] = useState<string | null>(null);
  const [pickedSize, setPickedSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPickFile = async () => {
    setError(null);
    try {
      const [file] = await pick({
        type: [docTypes.pdf, docTypes.images],
        allowMultiSelection: false,
      });
      if (!file.uri || !file.name || !file.type || !file.size) {
        setError(t('worker:documents.pickFailed'));
        return;
      }
      setPickedUri(file.uri);
      setPickedName(file.name);
      setPickedMime(file.type);
      setPickedSize(file.size);
    } catch {
      setError(t('worker:documents.pickCancelled'));
    }
  };

  const onUpload = async () => {
    if (!pickedUri || !pickedName || !pickedMime || pickedSize == null) {
      setError(t('worker:documents.pickRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const created = await createWorkerDocumentUpload(token, {
        documentType,
        fileName: pickedName,
        contentType: pickedMime,
        sizeBytes: pickedSize,
      });
      await putFileToPresignedUrl(
        created.uploadUrl,
        pickedUri,
        pickedMime,
      );
      await completeWorkerDocumentUpload(token, created.id);
      navigation.navigate('WorkerDocumentsList');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID="m.worker.documents.upload">
      <Text className="text-xl font-bold text-text-high">
        {t('worker:documents.uploadTitle')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:documents.uploadLead')}
      </Text>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {DOCUMENT_TYPES.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            className={`rounded-full px-3 py-2 ${
              documentType === type ? 'bg-brand-primary' : 'bg-surface-1'
            }`}
            onPress={() => setDocumentType(type)}
          >
            <Text
              className={`text-sm ${
                documentType === type ? 'text-white' : 'text-text-high'
              }`}
            >
              {t(`worker:documents.types.${type}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        className="mt-6 rounded-xl border border-surface-2 px-4 py-3"
        onPress={() => void onPickFile()}
      >
        <Text className="text-center text-base text-text-high">
          {pickedName ?? t('worker:documents.pickFile')}
        </Text>
      </Pressable>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onUpload()}
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('worker:documents.uploadSubmit')}
        </Text>
      </Pressable>
    </Screen>
  );
}
