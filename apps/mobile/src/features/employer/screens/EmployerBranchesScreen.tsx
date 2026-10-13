import { statusLabelTr, type Branch } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { listBranches } from '../../../api/branches-api';
import { JobCard } from '../../../components/job/JobCard';
import { JobsMap } from '../../../components/map/JobsMap';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { hasManagerPermission } from '../../../shared/auth/manager-permissions';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerBranches'>;

export function EmployerBranchesScreen({ route, navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const testID = route.params?.screenId ?? 'm.employer.branches.list';
  const [items, setItems] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listBranches(token);
      setItems(data.items ?? []);
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
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return items;
    }
    return items.filter((branch) => {
      const name = (branch.name ?? '').toLocaleLowerCase('tr-TR');
      const city = (branch.city ?? '').toLocaleLowerCase('tr-TR');
      const address = (branch.addressLine1 ?? '').toLocaleLowerCase('tr-TR');
      return name.includes(needle) || city.includes(needle) || address.includes(needle);
    });
  }, [items, query]);

  return (
    <ModulePage title={t('employer:branches.title')} testID={testID} scroll dock>
      
      {loading && items.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <TextField
          inset
          shape="capsule"
          label={t('employer:branches.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      {items.length > 0 ? (
        <View className="mt-4">
          <StatStrip
            items={[
              {
                label: t('employer:home.statBranches'),
                value: String(items.length),
              },
              {
                label: statusLabelTr('active'),
                value: String(
                  items.filter((branch) => branch.status === 'active').length,
                ),
              },
            ]}
          />
        </View>
      ) : null}
      {shown.length > 0 ? (
        <View className="mt-4">
          <JobsMap
            pins={shown.map((branch) => ({
              id: branch.id,
              title: branch.name,
              latitude: branch.latitude,
              longitude: branch.longitude,
            }))}
            selectedId={shown[0]?.id ?? null}
            onSelect={(id) =>
              navigation.navigate('EmployerBranchDetail', { branchId: id })
            }
          />
        </View>
      ) : null}
      {hasManagerPermission('branches.create') ? (
        <View className="mt-4">
          <Button
            label={t('employer:branches.createTitle')}
            onPress={() => navigation.navigate('EmployerBranchForm')}
          />
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        {shown.map((branch) => (
          <JobCard
            key={branch.id}
            status={branch.status}
            title={branch.name}
            onPress={() =>
              navigation.navigate('EmployerBranchDetail', { branchId: branch.id })
            }
          >
            <Text className="font-sans text-sm text-text-medium">
              {[branch.publicCode, branch.city, branch.addressLine1]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </JobCard>
        ))}
        {!loading && items.length === 0 ? (
          <EmptyState
            title={t('employer:branches.empty')}
            actionLabel={
              hasManagerPermission('branches.create')
                ? t('employer:branches.createTitle')
                : undefined
            }
            onAction={
              hasManagerPermission('branches.create')
                ? () => navigation.navigate('EmployerBranchForm')
                : undefined
            }
          />
        ) : null}
        {!loading && items.length > 0 && shown.length === 0 ? (
          <EmptyState title={t('employer:branches.searchEmpty')} />
        ) : null}
      </View>
    </ModulePage>
  );
}
