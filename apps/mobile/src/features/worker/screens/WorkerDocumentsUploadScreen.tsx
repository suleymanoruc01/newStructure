import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { pick, types as docTypes } from '@react-native-documents/picker';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ClayChip } from '../../../components/ui/ClayChip';
import { useTranslation } from 'react-i18next';
import type { WorkerDocumentType } from '@parton/api-contracts';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import {
  completeWorkerDocumentUpload,
  createWorkerDocumentUpload,
  putFileToPresignedUrl,
} from '../../../api/worker-documents-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { WizardShell } from '../../../components/ui/WizardShell';
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
  const [step, setStep] = useState(0);

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
    <ModulePage
      back={step > 0 ? () => setStep(0) : 'auto'}
      scroll
      testID="m.worker.documents.upload"
      title={t('worker:documents.uploadTitle')}
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('worker:documents.wizard.type')
            : t('worker:documents.wizard.file')
        }
        hint={
          step === 0
            ? t('worker:documents.wizard.typeHint')
            : t('worker:documents.wizard.fileHint')
        }
        primaryDisabled={submitting}
        primaryLabel={
          step === 0
            ? t('common:continue')
            : submitting
              ? t('common:loading')
              : t('worker:documents.uploadSubmit')
        }
        step={step + 1}
        total={2}
        onPrimary={() => {
          if (step === 0) {
            setError(null);
            setStep(1);
            return;
          }
          void onUpload();
        }}
      >
        {step === 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <ClayChip
                key={type}
                label={t(`worker:documents.types.${type}`)}
                selected={documentType === type}
                tone="accent"
                onPress={() => setDocumentType(type)}
              />
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {pickedName ? (
              <JobCard title={pickedName}>
                <StatusBadge
                  label={t(`worker:documents.types.${documentType}`)}
                  tone="strong"
                />
                {pickedSize != null ? (
                  <Text className="font-sans mt-2 text-sm text-text-medium">
                    {Math.round(pickedSize / 1024)} KB
                  </Text>
                ) : null}
              </JobCard>
            ) : null}
            <Button
              label={pickedName ?? t('worker:documents.pickFile')}
              variant="secondary"
              onPress={() => void onPickFile()}
            />
          </View>
        )}
      </WizardShell>
    </ModulePage>
  );
}
