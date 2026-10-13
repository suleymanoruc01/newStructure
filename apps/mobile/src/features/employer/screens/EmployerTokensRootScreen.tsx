import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import {
  allocateTokens,
  approveTokenRequest,
  createTokenRequest,
  fetchTokenBalance,
  fetchTokenLedger,
  fetchTokenRequests,
  rejectTokenRequest,
} from '../../../api/tokens-api';
import { formErrorMessage } from '../../../api/form-error';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { ClayChip } from '../../../components/ui/ClayChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { hasManagerPermission } from '../../../shared/auth/manager-permissions';
import {
  getAccessToken,
  getActiveContext,
} from '../../../shared/auth/session-memory';
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
  const [unallocated, setUnallocated] = useState(0);
  const [workplace, setWorkplace] = useState(0);
  const [branches, setBranches] = useState<
    { branchId: string; name: string; available: number }[]
  >([]);
  const [requests, setRequests] = useState<
    Awaited<ReturnType<typeof fetchTokenRequests>>['items']
  >([]);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateTarget, setAllocateTarget] = useState<'workplace' | 'branch'>(
    'workplace',
  );
  const [allocateBranchId, setAllocateBranchId] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const role = getActiveContext()?.role;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [bal, led, reqs] = await Promise.all([
        fetchTokenBalance(token),
        fetchTokenLedger(token),
        fetchTokenRequests(token),
      ]);
      setAvailable(bal.available);
      setHeld(bal.held);
      setBalance(bal.balance);
      setUnallocated(bal.unallocated ?? 0);
      setWorkplace(bal.workplace ?? 0);
      setBranches(bal.branches ?? []);
      setLedger(led.items ?? []);
      setRequests(reqs.items ?? []);
      if (!allocateBranchId && (bal.branches ?? []).length > 0) {
        setAllocateBranchId(bal.branches![0]!.branchId);
      }
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
      {hasManagerPermission('tokens.purchase') ? (
        <View className="mt-4">
          <Button
            label={t('employer:tokens.topUpCta')}
            onPress={() => navigation.navigate('EmployerTokenTopUp')}
          />
        </View>
      ) : null}
      <View className="mt-4">
        <StatStrip
          items={[
            {
              label: t('employer:tokens.unallocated'),
              value: String(unallocated),
            },
            {
              label: t('employer:tokens.workplacePool'),
              value: String(workplace),
            },
          ]}
        />
      </View>
      {role === 'employer' ? (
        <View className="mt-4 gap-3">
          <TextField
            keyboardType="number-pad"
            label={t('employer:tokens.allocateAmount')}
            value={allocateAmount}
            onChangeText={setAllocateAmount}
          />
          <View className="flex-row flex-wrap gap-2">
            <ClayChip
              label={t('employer:tokens.allocateTargetWorkplace')}
              selected={allocateTarget === 'workplace'}
              onPress={() => setAllocateTarget('workplace')}
            />
            {branches.map((branch) => (
              <ClayChip
                key={branch.branchId}
                label={`${branch.name} · ${branch.available}`}
                selected={
                  allocateTarget === 'branch' &&
                  allocateBranchId === branch.branchId
                }
                onPress={() => {
                  setAllocateTarget('branch');
                  setAllocateBranchId(branch.branchId);
                }}
              />
            ))}
          </View>
          <Button
            label={t('employer:tokens.allocateCta')}
            onPress={() => {
              void (async () => {
                try {
                  const token = getAccessToken();
                  if (!token) {
                    return;
                  }
                  await allocateTokens(
                    {
                      amount: Number.parseInt(allocateAmount, 10),
                      target: allocateTarget,
                      branchId:
                        allocateTarget === 'branch'
                          ? allocateBranchId
                          : undefined,
                    },
                    token,
                  );
                  setAllocateAmount('');
                  await load();
                } catch (err) {
                  setError(formErrorMessage(err, t));
                }
              })();
            }}
          />
        </View>
      ) : null}
      {role === 'manager' ? (
        <View className="mt-4 gap-3">
          <TextField
            keyboardType="number-pad"
            label={t('employer:tokens.requestAmount')}
            value={requestAmount}
            onChangeText={setRequestAmount}
          />
          <TextField
            label={t('employer:tokens.requestNote')}
            value={requestNote}
            onChangeText={setRequestNote}
          />
          <Button
            label={t('employer:tokens.requestCta')}
            onPress={() => {
              void (async () => {
                try {
                  const token = getAccessToken();
                  if (!token) {
                    return;
                  }
                  const amount = Number.parseInt(requestAmount, 10);
                  await createTokenRequest(
                    {
                      amount: Number.isFinite(amount) ? amount : undefined,
                      note: requestNote.trim() || undefined,
                    },
                    token,
                  );
                  setRequestAmount('');
                  setRequestNote('');
                  await load();
                } catch (err) {
                  setError(formErrorMessage(err, t));
                }
              })();
            }}
          />
        </View>
      ) : null}
      <View className="mt-4 gap-2">
        <Text className="font-sans text-sm font-semibold text-text-high">
          {t('employer:tokens.requestsTitle')}
        </Text>
        {requests.length === 0 ? (
          <EmptyState title={t('employer:tokens.requestEmpty')} />
        ) : null}
        {requests.map((row) => (
          <JobCard
            key={row.id}
            title={`${row.amount ?? '—'} · ${row.status}`}
          >
            {row.note ? (
              <Text className="font-sans text-sm text-text-medium">
                {row.note}
              </Text>
            ) : null}
            {role === 'employer' && row.status === 'pending' ? (
              <View className="mt-2 gap-2">
                {row.amount == null ? (
                  <TextField
                    keyboardType="number-pad"
                    label={t('employer:tokens.approveAmount')}
                    value={approveAmount}
                    onChangeText={setApproveAmount}
                  />
                ) : null}
                <Button
                  label={t('employer:tokens.approve')}
                  onPress={() => {
                    void (async () => {
                      try {
                        const token = getAccessToken();
                        if (!token) {
                          return;
                        }
                        const parsed = Number.parseInt(approveAmount, 10);
                        await approveTokenRequest(
                          row.id,
                          {
                            amount:
                              row.amount == null && Number.isFinite(parsed)
                                ? parsed
                                : undefined,
                          },
                          token,
                        );
                        await load();
                      } catch (err) {
                        setError(formErrorMessage(err, t));
                      }
                    })();
                  }}
                />
                <Button
                  label={t('employer:tokens.reject')}
                  variant="secondary"
                  onPress={() => {
                    void (async () => {
                      try {
                        const token = getAccessToken();
                        if (!token) {
                          return;
                        }
                        await rejectTokenRequest(row.id, token);
                        await load();
                      } catch (err) {
                        setError(formErrorMessage(err, t));
                      }
                    })();
                  }}
                />
              </View>
            ) : null}
          </JobCard>
        ))}
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
