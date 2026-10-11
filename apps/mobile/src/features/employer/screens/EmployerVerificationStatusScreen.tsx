import { statusLabelTr } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { openInTab } from '../../../app/navigation/dock-routes';
import { ApiClientError } from '../../../api/client';
import { fetchEmployerMe } from '../../../api/employers-api';
import { AccountLinkSection } from '../../shared/AccountLinkSection';
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
      {loading ? (
        <Text className="font-sans mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {legalName ? (
        <Text className="font-sans mt-4 text-base font-semibold text-text-high">
          {legalName}
        </Text>
      ) : null}
      {status ? (
        <Text className="font-sans mt-2 text-sm text-text-medium">
          {statusLabelTr(status)}
        </Text>
      ) : null}
      {!canPublish && status ? (
        <Text className="font-sans mt-4 rounded-xl bg-surface-1 p-3 text-sm text-feedback-error">
          {t('employer:verification.publishBlocked')}
        </Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <AccountLinkSection />
      <Pressable
        accessibilityRole="button"
        className="mt-8 rounded-lg bg-action-primary px-4 py-3"
        onPress={() =>
          openInTab(navigation, 'EmployerJobsList', [
            'EmployerJobs',
            'ManagerJobs',
          ])
        }
      >
        <Text className="font-sans text-center font-semibold text-text-on">
          {t('employer:verification.backToJobs')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
