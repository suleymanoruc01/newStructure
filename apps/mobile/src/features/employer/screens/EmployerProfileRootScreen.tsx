import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { listBranches } from '../../../api/branches-api';
import { fetchEmployerMe } from '../../../api/employers-api';
import { fetchJobCatalog, listEmployerJobs } from '../../../api/jobs-api';
import { listFavorites } from '../../../api/favorites-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { NavRow } from '../../../components/ui/NavRow';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerProfileRoot'>;

export function EmployerProfileRootScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['employer', 'common', 'system']);
  const { signOut } = useAuth();
  const testID = route.params?.screenId ?? 'm.employer.profile.root';
  const [legalName, setLegalName] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null,
  );
  const [available, setAvailable] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [taxId, setTaxId] = useState<string | null>(null);
  const [industryCodes, setIndustryCodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [branchPreview, setBranchPreview] = useState<
    Awaited<ReturnType<typeof listBranches>>['items']
  >([]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    const [employer, tokens, branches, jobs, favs, catalog] =
      await Promise.allSettled([
        fetchEmployerMe(token),
        fetchTokenBalance(token),
        listBranches(token),
        listEmployerJobs(token),
        listFavorites(token),
        fetchJobCatalog(),
      ]);
    if (employer.status === 'fulfilled') {
      setLegalName(employer.value.legalName);
      setVerificationStatus(employer.value.verificationStatus);
      setTaxId(employer.value.taxId);
      setIndustryCodes(employer.value.industryCodes);
    }
    if (tokens.status === 'fulfilled') {
      setAvailable(tokens.value.available);
      setHeld(tokens.value.held);
    }
    if (branches.status === 'fulfilled') {
      setBranchCount(branches.value.items.length);
      setBranchPreview(branches.value.items);
    }
    if (catalog.status === 'fulfilled') {
      setSectors(catalog.value.sectors);
    }
    if (jobs.status === 'fulfilled') {
      setPublishedCount(
        jobs.value.items.filter((job) => job.status === 'published').length,
      );
    }
    if (favs.status === 'fulfilled') {
      setFavoriteCount(
        favs.value.items.filter((fav) => fav.type === 'worker').length,
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ModulePage title={t('employer:profile.title')} testID={testID} scroll dock>
      
      {legalName == null && available == null ? (
        <View className="mt-2">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      <View className="mt-2">
      <JobCard
        title={legalName ?? t('employer:profile.title')}
        status={verificationStatus}
      >
        {taxId ? (
          <StatusBadge
            label={`${t('employer:business.taxId')} · ${taxId}`}
            tone="strong"
          />
        ) : null}
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('employer:home.statTokens'),
                value: available == null ? '—' : String(available),
              },
              {
                label: t('employer:home.statHeld'),
                value: held == null ? '—' : String(held),
              },
              {
                label: t('employer:profile.statJobs'),
                value: publishedCount == null ? '—' : String(publishedCount),
              },
              {
                label: t('employer:profile.statBranches'),
                value: branchCount == null ? '—' : String(branchCount),
              },
              {
                label: t('employer:jobs.navFavorites'),
                value: favoriteCount == null ? '—' : String(favoriteCount),
              },
            ]}
          />
        </View>
      </JobCard>
      </View>
      {industryCodes.length === 0 && legalName != null ? (
        <View className="mt-4">
          <EmptyState
            title={t('employer:profile.noIndustry')}
            actionLabel={t('employer:industry.title')}
            onAction={() => navigation.navigate('EmployerIndustry')}
          />
        </View>
      ) : null}
      {industryCodes.length > 0 ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {industryCodes.map((code) => (
            <StatusBadge
              key={code}
              label={
                sectors.find((sector) => sector.code === code)?.displayName ??
                code
              }
              tone="strong"
            />
          ))}
        </View>
      ) : null}
      {branchPreview.length > 0 ? (
        <View className="mt-4 gap-2">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:branches.title')}
          </Text>
          {branchPreview.map((branch) => (
            <JobCard
              key={branch.id}
              title={branch.name}
              onPress={() =>
                navigation.navigate('EmployerBranchDetail', {
                  branchId: branch.id,
                })
              }
            >
              {branch.city ? (
                <Text className="font-sans text-sm text-text-medium">
                  {branch.city}
                </Text>
              ) : null}
            </JobCard>
          ))}
        </View>
      ) : null}
      <View className="mt-4">
        <NavRow
          label={t('employer:jobs.navVerification')}
          onPress={() => navigation.navigate('EmployerVerificationStatus')}
        />
        <NavRow
          label={t('employer:tokens.title')}
          onPress={() => navigation.navigate('EmployerTokensRoot')}
        />
        <NavRow
          label={t('employer:jobs.navFavorites')}
          onPress={() => navigation.navigate('EmployerFavoriteWorkers')}
        />
        <NavRow
          label={t('employer:jobs.navCalendar')}
          onPress={() => navigation.navigate('EmployerCalendar')}
        />
        <NavRow
          label={t('employer:jobs.navDisputes')}
          onPress={() => navigation.navigate('EmployerOpenDisputes')}
        />
        <NavRow
          label={t('employer:jobs.navRatings')}
          onPress={() => navigation.navigate('SharedRatingsPending')}
        />
        <NavRow
          label={t('system:notifications.title')}
          onPress={() => navigation.navigate('SharedNotificationsList')}
        />
        <NavRow
          label={t('employer:dashboard.title')}
          onPress={() => navigation.navigate('EmployerDashboard')}
        />
        <NavRow
          label={t('employer:business.title')}
          onPress={() => navigation.navigate('EmployerBusiness')}
        />
        <NavRow
          label={t('employer:industry.title')}
          onPress={() => navigation.navigate('EmployerIndustry')}
        />
        <NavRow
          label={t('employer:checklist.title')}
          onPress={() => navigation.navigate('EmployerChecklist')}
        />
        <NavRow
          label={t('employer:ops.title')}
          onPress={() => navigation.navigate('EmployerOpsSettings')}
        />
        <NavRow
          label={t('system:support.title')}
          onPress={() => navigation.navigate('SharedSupportRequest')}
        />
        <NavRow
          label={t('system:settings.title')}
          onPress={() => navigation.navigate('SharedSettings')}
        />
      </View>
      <View className="mt-8">
        <Button
          label={t('common:signOut')}
          onPress={() => {
            void (async () => {
              const confirmed = await confirmDestructive(
                t('common:signOut'),
                t('common:signOutBody'),
                t('common:signOut'),
                t('common:cancel'),
              );
              if (confirmed) {
                await signOut();
              }
            })();
          }}
          variant="secondary"
        />
      </View>
    </ModulePage>
  );
}
