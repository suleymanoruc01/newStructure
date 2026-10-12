import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { openInTab } from '../../../app/navigation/dock-routes';
import { ApiClientError } from '../../../api/client';
import { fetchEmployerMe } from '../../../api/employers-api';
import { AccountLinkSection } from '../../shared/AccountLinkSection';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerVerificationStatus'
>;

export function EmployerVerificationStatusScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [status, setStatus] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string | null>(null);
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
      const employer = await fetchEmployerMe(token);
      setStatus(employer.verificationStatus);
      setLegalName(employer.legalName);
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

  const canPublish =
    status === 'verified' || status === 'bypass';

  return (
    <ModulePage title={t('employer:verification.title')} testID="m.employer.verification.status" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('employer:verification.lead')}
      </Text>
      {loading && !status ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {status ? (
        <View className="mt-4">
          <JobCard
            status={status}
            title={legalName ?? t('employer:verification.title')}
          >
            <StatusBadge
              label={t(`employer:verification.status.${status}`, {
                defaultValue: status,
              })}
              tone={canPublish ? 'strong' : 'warn'}
            />
            {!canPublish ? (
              <Text className="font-sans mt-2 text-sm text-feedback-error">
                {t('employer:verification.publishBlocked')}
              </Text>
            ) : null}
          </JobCard>
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <AccountLinkSection />
      <Button
        className="mt-8"
        label={t('employer:verification.backToJobs')}
        onPress={() =>
          openInTab(navigation, 'EmployerJobsList', [
            'EmployerJobs',
            'ManagerJobs',
          ])
        }
      />
    </ModulePage>
  );
}
