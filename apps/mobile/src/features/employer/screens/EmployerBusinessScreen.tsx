import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { fetchEmployerMe, patchEmployerMe } from '../../../api/employers-api';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerBusiness'>;

export function EmployerBusinessScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const employer = await fetchEmployerMe(token);
        setLegalName(employer.legalName);
        setTradingName(employer.tradingName ?? '');
        setTaxId(employer.taxId);
      } catch (err) {
        setError(formErrorMessage(err, t));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const onSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await patchEmployerMe(
        {
          legalName,
          tradingName: tradingName.trim() || undefined,
        },
        token,
      );
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage
      title={t('employer:business.title')}
      testID="m.employer.business.root"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        {taxId ? (
          <JobCard title={legalName || t('employer:business.title')}>
            <StatusBadge
              label={`${t('employer:business.taxId')} · ${taxId}`}
            />
          </JobCard>
        ) : null}
        <TextField
          label={t('employer:business.legalName')}
          value={legalName}
          onChangeText={setLegalName}
        />
        <TextField
          label={t('employer:business.tradingName')}
          value={tradingName}
          onChangeText={setTradingName}
        />
        <Button
          disabled={submitting}
          label={t('common:continue')}
          onPress={() => void onSave()}
        />
      </View>
    </ModulePage>
  );
}
