import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkerDocumentType } from '@parton/api-contracts';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { listWorkerDocuments } from '../../../api/worker-documents-api';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pressable } from '../../../components/ui/Pressable';
import { JobCard } from '../../../components/job/JobCard';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerDocumentsList'>;
type DocFilter = 'all' | WorkerDocumentType;

const DOC_FILTERS: DocFilter[] = [
  'all',
  'id_card',
  'criminal_record',
  'health_report',
  'food_hygiene',
  'drivers_license',
  'other',
];

export function WorkerDocumentsListScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listWorkerDocuments>>['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<DocFilter>('all');
  const [query, setQuery] = useState('');

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

  const shown = useMemo(() => {
    const byType =
      typeFilter === 'all'
        ? items
        : items.filter((doc) => doc.documentType === typeFilter);
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return byType;
    }
    return byType.filter((doc) =>
      doc.fileName.toLocaleLowerCase('tr-TR').includes(needle),
    );
  }, [items, query, typeFilter]);

  return (
    <ModulePage
      title={t('worker:documents.title')}
      testID="m.worker.documents.list"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('worker:documents.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {DOC_FILTERS.map((value) => (
            <Pressable
              key={value}
              className={`rounded-full px-3 py-2 ${
                typeFilter === value ? 'bg-action-primary' : 'bg-surface-1'
              }`}
              onPress={() => setTypeFilter(value)}
            >
              <Text
                className={`font-sans text-sm ${
                  typeFilter === value ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {value === 'all'
                  ? t('worker:documents.filterAll')
                  : t(`worker:documents.types.${value}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="mt-4">
          <StatStrip
            items={[
              {
                label: t('worker:documents.statPending'),
                value: String(
                  items.filter((doc) => doc.status === 'pending_upload').length,
                ),
              },
              {
                label: t('worker:documents.statUploaded'),
                value: String(
                  items.filter((doc) => doc.status === 'uploaded').length,
                ),
              },
            ]}
          />
        </View>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('worker:documents.uploadCta')}
          onPress={() => navigation.navigate('WorkerDocumentsUpload')}
        />
      </View>
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((doc) => (
          <JobCard
            key={doc.id}
            status={doc.status}
            title={t(`worker:documents.types.${doc.documentType}`)}
          >
            <Text className="font-sans text-sm text-text-medium">{doc.fileName}</Text>
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState
            title={t('worker:documents.empty')}
            actionLabel={t('worker:documents.uploadCta')}
            onAction={() => navigation.navigate('WorkerDocumentsUpload')}
          />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState title={t('worker:documents.searchEmpty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
