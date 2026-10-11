import { statusLabelTr, type Branch } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { listBranches } from '../../../api/branches-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerBranches'>;

export function EmployerBranchesScreen({ route }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const testID = route.params?.screenId ?? 'm.employer.branches.list';
  const [items, setItems] = useState<Branch[]>([]);
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
      const data = await listBranches(token);
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
    <ModulePage title={t('employer:branches.title')} testID={testID} scroll dock>
      
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4 gap-3">
        {items.map((branch) => (
          <View key={branch.id} className="rounded-lg bg-surface-1 p-4">
            <Text className="font-sans text-lg font-semibold text-text-high">
              {branch.name}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {[branch.city, branch.addressLine1].filter(Boolean).join(' · ')}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-low">
              {statusLabelTr(branch.status)}
            </Text>
          </View>
        ))}
        {!loading && items.length === 0 ? (
          <Text className="font-sans text-text-medium">{t('employer:branches.empty')}</Text>
        ) : null}
      </View>
    </ModulePage>
  );
}
