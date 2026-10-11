import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { createEmployer } from '../../../api/employers-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'EmployerOnboardingBusiness'
>;

export function EmployerOnboardingBusinessScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'common', 'errors']);
  const { applyEmployerCreate } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industryCodes, setIndustryCodes] = useState('hospitality');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const industries = industryCodes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const result = await createEmployer(
        {
          legalName,
          tradingName: tradingName || undefined,
          taxId,
          industryCodes: industries,
        },
        token,
      );
      applyEmployerCreate(result);
      navigation.replace('EmployerOnboardingBranch');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID={ONBOARDING_SCREEN_IDS.employerBusiness}>
      <Text className="text-2xl font-bold text-text-high">
        {t('onboarding:employer.businessTitle')}
      </Text>
      <Text className="mt-2 text-base text-text-medium">
        {t('onboarding:employer.businessSubtitle')}
      </Text>
      <View className="mt-6 gap-3">
        <TextField
          label={t('onboarding:employer.legalName')}
          value={legalName}
          onChangeText={setLegalName}
        />
        <TextField
          label={t('onboarding:employer.tradingName')}
          value={tradingName}
          onChangeText={setTradingName}
        />
        <TextField
          label={t('onboarding:employer.taxId')}
          value={taxId}
          onChangeText={setTaxId}
          keyboardType="number-pad"
        />
        <TextField
          label={t('onboarding:employer.industries')}
          value={industryCodes}
          onChangeText={setIndustryCodes}
        />
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6">
        <Button
          disabled={submitting}
          label={t('common:continue')}
          onPress={() => void onSubmit()}
        />
      </View>
    </Screen>
  );
}
