import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { ClayChip } from '../../../components/ui/ClayChip';
import { clayChip } from '../../../components/ui/clay';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { statusLabelTr, type ApplicationStatus } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import {
  acceptApplication,
  listJobApplications,
  moveApplicationToSubstitute,
  rejectApplication,
  removeApplicationSubstitute,
  revokeAcceptApplication,
} from '../../../api/applications-api';
import { createFavorite } from '../../../api/favorites-api';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { ApiClientError } from '../../../api/client';
import { ApplicantFacts } from '../../../components/application/ApplicantFacts';
import { JobCard } from '../../../components/job/JobCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { triggerHaptic } from '../../../shared/ui/haptics';

type CatalogSector = Awaited<ReturnType<typeof fetchJobCatalog>>['sectors'][number];

type Filter = 'pending' | 'accepted' | 'substitute' | 'rejected';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerApplicants'>;

export function EmployerApplicantsScreen({ route, navigation }: Props) {
  const { jobId, jobTitle, filter: initialFilter } = route.params ?? {
    jobId: '',
    jobTitle: null,
    filter: undefined,
  };
  const { t } = useTranslation(['employer', 'common', 'errors', 'system']);
  const [filter, setFilter] = useState<Filter>(initialFilter ?? 'pending');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listJobApplications>>['items']
  >([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sectors, setSectors] = useState<CatalogSector[]>([]);

  useEffect(() => {
    void fetchJobCatalog()
      .then((catalog) => setSectors(catalog.sectors ?? []))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await listJobApplications(jobId, token, filter);
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
  }, [filter, jobId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const [sortMode, setSortMode] = useState<'match' | 'newest'>('match');

  const shown = useMemo(() => {
    let list = items;
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (needle) {
      list = list.filter((item) => {
        const name = (
          item.workerDisplayName ??
          `${item.profileSnapshot?.firstName ?? ''} ${item.profileSnapshot?.lastName ?? ''}`
        )
          .trim()
          .toLocaleLowerCase('tr-TR');
        return name.includes(needle);
      });
    }
    return [...list].sort((a, b) => {
      if (sortMode === 'match') {
        const scoreA = a.candidateScore?.totalScore ?? 0;
        const scoreB = b.candidateScore?.totalScore ?? 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, query, sortMode]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await fn();
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  const runOptimistic = async (
    targetId: string,
    nextStatus: ApplicationStatus,
    hapticTone: 'light' | 'medium' | 'success',
    fn: () => Promise<unknown>,
  ) => {
    triggerHaptic(hapticTone);
    const previous = items;
    setItems((curr) =>
      curr.map((it) => (it.id === targetId ? { ...it, status: nextStatus } : it)),
    );
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await fn();
      await load();
    } catch (err) {
      triggerHaptic('error');
      setItems(previous);
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  const filters: Filter[] = ['pending', 'accepted', 'substitute', 'rejected'];

  return (
    <ModulePage
      title={jobTitle ?? t('employer:applicants.title')}
      testID="m.employer.applicants.list"
      scroll={false}
    >
      <View className="mb-3 flex-row flex-wrap gap-2">
        {filters.map((value) => (
          <ClayChip
            key={value}
            label={statusLabelTr(value)}
            selected={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>
      <View className="mb-3 flex-row items-center gap-2">
        <ClayChip
          label="🎯 En Yüksek Uyum"
          selected={sortMode === 'match'}
          onPress={() => setSortMode('match')}
        />
        <ClayChip
          label="🕒 En Yeni"
          selected={sortMode === 'newest'}
          onPress={() => setSortMode('newest')}
        />
      </View>
      <View className="mb-3">
        <TextField
          inset
          shape="capsule"
          label={t('employer:applicants.search')}
          onChangeText={setQuery}
          value={query}
        />
      </View>
      <View className="mb-3">
        <StatStrip
          items={[
            {
              label: statusLabelTr(filter),
              value: loading ? '—' : String(shown.length),
            },
          ]}
        />
      </View>
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <SkeletonList />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={shown}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              title={
                query.trim()
                  ? t('employer:applicants.searchEmpty')
                  : t('employer:applicants.empty')
              }
            />
          }
          renderItem={({ item }) => (
            <View className="mb-3">
              <JobCard
                status={item.status}
                title={
                  item.workerDisplayName ??
                  `${item.profileSnapshot?.firstName ?? ''} ${item.profileSnapshot?.lastName ?? ''}`.trim()
                }
                onPress={() =>
                  navigation.navigate('EmployerApplicantDetail', {
                    applicationId: item.id,
                    jobTitle,
                  })
                }
              >
                <ApplicantFacts
                  snapshot={item.profileSnapshot}
                  sectors={sectors}
                  candidateScore={item.candidateScore}
                />
              </JobCard>
              <ApplicantActions
                status={item.status}
                onProcess={() =>
                  navigation.navigate('SharedJobProcess', {
                    applicationId: item.id,
                  })
                }
                onAccept={() =>
                  void runOptimistic(item.id, 'accepted', 'success', async () => {
                    const token = getAccessToken()!;
                    await acceptApplication(item.id, token, `accept-${item.id}`);
                  })
                }
                onReject={() =>
                  void runOptimistic(item.id, 'rejected', 'medium', async () => {
                    await rejectApplication(item.id, getAccessToken()!);
                  })
                }
                onSubstitute={() =>
                  void runOptimistic(item.id, 'substitute', 'light', async () => {
                    await moveApplicationToSubstitute(item.id, getAccessToken()!);
                  })
                }
                onRemoveSubstitute={() =>
                  void runOptimistic(item.id, 'pending', 'light', async () => {
                    await removeApplicationSubstitute(item.id, getAccessToken()!);
                  })
                }
                onRevoke={() =>
                  void runOptimistic(item.id, 'pending', 'medium', async () => {
                    await revokeAcceptApplication(
                      item.id,
                      getAccessToken()!,
                      `revoke-${item.id}`,
                    );
                  })
                }
                onFavorite={() => {
                  triggerHaptic('success');
                  void run(async () => {
                    await createFavorite(
                      getAccessToken()!,
                      { type: 'worker', id: item.workerUserId },
                      `fav-worker-${item.workerUserId}`,
                    );
                  });
                }}
                labels={{
                  accept: t('employer:applicants.accept'),
                  reject: t('employer:applicants.reject'),
                  substitute: t('employer:applicants.substitute'),
                  remove: t('employer:applicants.removeSubstitute'),
                  revoke: t('employer:applicants.revoke'),
                  favorite: t('employer:applicants.favorite'),
                  process: t('employer:applicants.process'),
                }}
              />
            </View>
          )}
        />
      )}
    </ModulePage>
  );
}

function ApplicantActions({
  status,
  onProcess,
  onAccept,
  onReject,
  onSubstitute,
  onRemoveSubstitute,
  onRevoke,
  onFavorite,
  labels,
}: {
  status: ApplicationStatus;
  onProcess: () => void;
  onAccept: () => void;
  onReject: () => void;
  onSubstitute: () => void;
  onRemoveSubstitute: () => void;
  onRevoke: () => void;
  onFavorite: () => void;
  labels: Record<string, string>;
}) {
  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      <ClayChip label={labels.process} onPress={onProcess} />
      {status === 'pending' || status === 'substitute' ? (
        <ClayChip label={labels.accept} selected onPress={onAccept} />
      ) : null}
      {status === 'pending' || status === 'substitute' ? (
        <Pressable
          className="rounded-full bg-feedback-error px-3 py-2"
          style={clayChip(true)}
          onPress={onReject}
        >
          <Text className="font-sans text-sm font-semibold text-text-on">
            {labels.reject}
          </Text>
        </Pressable>
      ) : null}
      {status === 'pending' ? (
        <ClayChip label={labels.substitute} onPress={onSubstitute} />
      ) : null}
      {status === 'substitute' ? (
        <ClayChip label={labels.remove} onPress={onRemoveSubstitute} />
      ) : null}
      {status === 'accepted' ? (
        <Pressable
          className="rounded-full bg-feedback-error px-3 py-2"
          style={clayChip(true)}
          onPress={onRevoke}
        >
          <Text className="font-sans text-sm font-semibold text-text-on">
            {labels.revoke}
          </Text>
        </Pressable>
      ) : null}
      <ClayChip label={labels.favorite} onPress={onFavorite} />
    </View>
  );
}
