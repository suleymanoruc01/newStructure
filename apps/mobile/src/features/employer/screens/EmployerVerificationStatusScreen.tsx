import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchEmployerMe } from '../../../api/employers-api';
import { Screen } from '../../../components/ui/Screen';
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
    <Screen scroll testID="m.employer.verification.status">
      <Text className="text-2xl font-bold text-text-high">
        {t('employer:verification.title')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('employer:verification.lead')}
      </Text>
      {loading ? (
        <Text className="mt-4 text-text-medium">{t('common:loading')}</Text>
      ) : null}
      {legalName ? (
        <Text className="mt-4 text-base font-semibold text-text-high">
          {legalName}
        </Text>
      ) : null}
      {status ? (
        <Text className="mt-2 text-sm text-text-medium">
          {t(`employer:verification.status.${status}`)}
        </Text>
      ) : null}
      {!canPublish && status ? (
        <Text className="mt-4 rounded-xl bg-surface-1 p-3 text-sm text-feedback-error">
          {t('employer:verification.publishBlocked')}
        </Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        onPress={() => navigation.navigate('EmployerJobsList')}
      >
        <Text className="text-center font-semibold text-white">
          {t('employer:verification.backToJobs')}
        </Text>
      </Pressable>
    </Screen>
  );
}
