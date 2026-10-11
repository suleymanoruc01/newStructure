import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthOtp'>;

export function AuthOtpScreen({ navigation, route }: Props) {
  const { challengeId, phone, purpose } = route.params;
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { requestPhoneOtp, verifyPhoneOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerify = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await verifyPhoneOtp(challengeId, code, { holdPhase: true });
      navigation.replace('AuthPassword', { mode: 'set', purpose });
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
      const next = await requestPhoneOtp(phone, purpose);
      navigation.setParams({ challengeId: next.challengeId });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      }
    }
  };

  return (
    <ModulePage
      title={
        purpose === 'password_reset'
          ? t('auth:otp.resetTitle')
          : t('auth:otp.signupTitle')
      }
      testID={SCREEN_IDS.otp}
      scroll
    >
      <Text className="font-sans mt-2 text-base text-text-medium">
        {t('auth:otp.subtitle', { phone })}
      </Text>
      {purpose === 'password_reset' ? (
        <Text className="font-sans mt-2 text-sm text-text-low">
          {t('auth:otp.resetHint')}
        </Text>
      ) : null}
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
      <Button label={t('auth:otp.resend')} onPress={() => void onResend()} variant="secondary" />
      <Button
        label={t('auth:otp.changeNumber')}
        onPress={() => navigation.goBack()}
        variant="secondary"
      />
    </ModulePage>
  );
}
