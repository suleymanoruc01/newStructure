import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPhone'>;

function normalizeTrPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('90')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+90${digits.slice(1)}`;
  }
  return `+90${digits}`;
}

export function AuthPhoneScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { requestPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onContinue = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const e164 = normalizeTrPhone(phone);
      const { challengeId } = await requestPhoneOtp(e164);
      navigation.navigate('AuthOtp', { challengeId, phone: e164 });
    } catch (err) {
      if (err instanceof ApiClientError) {
        const key = `errors:${err.code}`;
        setError(t(key, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID={SCREEN_IDS.phone}>
      <Text className="text-2xl font-bold text-text-high">{t('auth:phone.title')}</Text>
      <Text className="mt-2 text-base text-text-medium">
        {t('auth:phone.subtitle')}
      </Text>
      <TextField
        label={t('auth:phone.phoneLabel')}
        placeholder={t('auth:phone.phonePlaceholder')}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={error}
        testID="auth-phone-input"
      />
      <Text className="mb-4 text-sm text-text-low">{t('auth:phone.legalHint')}</Text>
      <Button
        disabled={submitting || phone.replace(/\D/g, '').length < 10}
        label={t('common:continue')}
        onPress={() => void onContinue()}
        testID="auth-phone-continue"
      />
      <Button
        label={t('auth:phone.openPolicies')}
        onPress={() => navigation.navigate('AuthPolicies')}
        variant="ghost"
      />
    </Screen>
  );
}
