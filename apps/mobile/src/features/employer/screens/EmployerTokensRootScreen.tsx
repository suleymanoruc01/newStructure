import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchTokenBalance, fetchTokenLedger } from '../../../api/tokens-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { ClayChip } from '../../../components/ui/ClayChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerTokensRoot'>;

export function EmployerTokensRootScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [available, setAvailable] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<
    { id: string; type: string; amount: number; createdAt: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [bal, led] = await Promise.all([
        fetchTokenBalance(token),
        fetchTokenLedger(token),
      ]);
      setAvailable(bal.available);
      setHeld(bal.held);
      setBalance(bal.balance);
      setLedger(led.items);
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const shownLedger = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    return ledger.filter((row) => {
      if (typeFilter && row.type !== typeFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const typeLabel = t(`employer:tokens.ledgerType.${row.type}`, {
        defaultValue: row.type,
      }).toLocaleLowerCase('tr-TR');
      return typeLabel.includes(needle) || String(row.amount).includes(needle);
    });
  }, [ledger, query, t, typeFilter]);

  return (
    <ModulePage
      title={t('employer:tokens.title')}
      testID="m.employer.tokens.root"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      
      {available == null || held == null || balance == null ? (
        loading ? (
          <View className="mt-2">
            <SkeletonList rows={1} />
          </View>
        ) : null
      ) : (
      <StatStrip
        items={[
          {
            label: t('employer:tokens.statAvailable'),
            value: String(available),
          },
          {
            label: t('employer:tokens.statHeld'),
            value: String(held),
          },
          {
            label: t('employer:home.statTokens'),
            value: String(balance),
          },
        ]}
      />
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {ledger.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          <ClayChip
            label={t('employer:tokens.filterAll')}
            selected={typeFilter == null}
            onPress={() => setTypeFilter(null)}
          />
          {[...new Set(ledger.map((row) => row.type))].map((type) => (
            <ClayChip
              key={type}
              label={t(`employer:tokens.ledgerType.${type}`, { defaultValue: type })}
              selected={typeFilter === type}
              onPress={() =>
                setTypeFilter((current) => (current === type ? null : type))
              }
            />
          ))}
        </View>
      ) : null}
      {ledger.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('employer:tokens.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('employer:tokens.topUpCta')}
          onPress={() => navigation.navigate('EmployerTokenTopUp')}
        />
      </View>
      {loading && ledger.length === 0 ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      <View className="mt-3 gap-2">
        {ledger.length === 0 && !loading ? (
          <EmptyState
            title={t('employer:tokens.historyEmpty')}
            actionLabel={t('employer:tokens.topUpCta')}
            onAction={() => navigation.navigate('EmployerTokenTopUp')}
          />
        ) : null}
        {ledger.length > 0 && shownLedger.length === 0 ? (
          <EmptyState title={t('employer:tokens.searchEmpty')} />
        ) : null}
        {shownLedger.map((row) => (
            <JobCard
              key={row.id}
              title={t(`employer:tokens.ledgerType.${row.type}`, {
                defaultValue: row.type,
              })}
            >
              <StatusBadge
                label={row.amount > 0 ? `+${row.amount}` : String(row.amount)}
                tone={row.amount > 0 ? 'strong' : 'error'}
              />
              <Text className="font-sans mt-1 text-sm text-text-medium">
                {formatIstanbul(row.createdAt, timeZone)}
              </Text>
            </JobCard>
          ))}
      </View>
    </ModulePage>
  );
}
