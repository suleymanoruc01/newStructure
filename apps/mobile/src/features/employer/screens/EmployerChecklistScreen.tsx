import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { fetchEmployerSetupStatus } from '../../../api/employers-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { WizardSteps } from '../../../components/ui/WizardSteps';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerChecklist'>;

export function EmployerChecklistScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const { contexts } = useAuth();
  const workplaceId = contexts.find(
    (item) => item.role === 'employer' || item.role === 'manager',
  )?.employerId;
  const [complete, setComplete] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const status = await fetchEmployerSetupStatus(token);
      setComplete(status.complete);
      setMissing(status.missing ?? []);
      setLoaded(true);
    } catch {
      setError(t('common:networkError'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const requiredMissing = missing.filter(
    (key) => key === 'employer' || key === 'industries',
  );

  return (
    <ModulePage
      title={t('employer:checklist.title')}
      testID="m.employer.onboarding.checklist"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loaded ? (
        <WizardSteps step={Math.max(0, 2 - requiredMissing.length)} total={2} />
      ) : null}
      <View className="mt-3">
        <StatusBadge
          label={
            complete
              ? t('employer:checklist.complete')
              : t('employer:checklist.incomplete')
          }
          tone={complete ? 'strong' : 'warn'}
        />
      </View>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('employer:checklist.statDone'),
              value: String(Math.max(0, 2 - requiredMissing.length)),
            },
            {
              label: t('employer:checklist.statMissing'),
              value: String(requiredMissing.length),
            },
          ]}
        />
      </View>
      <View className="mt-4 gap-2">
        {requiredMissing.map((key) => (
          <JobCard
            key={key}
            title={t(`employer:checklist.missing.${key}`, { defaultValue: key })}
            onPress={() => {
              if (key === 'employer') {
                navigation.navigate('EmployerCreateWorkplace');
                return;
              }
              if (key === 'industries') {
                navigation.navigate('EmployerIndustry');
              }
            }}
          >
            <StatusBadge
              label={t('employer:checklist.incomplete')}
              tone="warn"
            />
          </JobCard>
        ))}
        {complete ? (
          <EmptyState title={t('employer:checklist.complete')} />
        ) : null}
      </View>
      <View className="mt-6 gap-3">
        <Button
          label={t('employer:business.title')}
          variant="secondary"
          onPress={() =>
            navigation.navigate(
              workplaceId ? 'EmployerBusiness' : 'EmployerCreateWorkplace',
            )
          }
        />
        {workplaceId ? (
          <Button
            label={t('employer:branches.createTitle')}
            variant="secondary"
            onPress={() => navigation.navigate('EmployerBranchForm')}
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
