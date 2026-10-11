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

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthOtp'>;

export function AuthOtpScreen({ navigation, route }: Props) {
  const { challengeId, phone } = route.params;
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { verifyPhoneOtp, requestPhoneOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerify = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const user = await verifyPhoneOtp(challengeId, code);
      navigation.replace(
        user.roles.length === 0 ? 'AuthRoleSelect' : 'AuthPolicies',
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          t(`errors:${err.code}`, {
            defaultValue: t('auth:otp.wrongCode'),
          }),
        );
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      await requestPhoneOtp(phone);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      }
    }
  };

  return (
    <Screen scroll testID={SCREEN_IDS.otp}>
      <Text className="text-2xl font-bold text-text-high">{t('auth:otp.title')}</Text>
      <Text className="mt-2 text-base text-text-medium">
        {t('auth:otp.subtitle', { phone })}
      </Text>
      <TextField
        label={t('auth:otp.codeLabel')}
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        error={error}
        testID="auth-otp-input"
      />
      <Button
        disabled={submitting || code.length !== 6}
        label={t('common:continue')}
        onPress={() => void onVerify()}
      />
      <Button label={t('auth:otp.resend')} onPress={() => void onResend()} variant="ghost" />
      <Button
        label={t('auth:otp.changeNumber')}
        onPress={() => navigation.goBack()}
        variant="ghost"
      />
    </Screen>
  );
}
