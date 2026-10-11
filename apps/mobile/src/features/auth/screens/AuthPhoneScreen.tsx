import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { platformIdentityProvider } from '../linked-sign-in';
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
  const { requestPhoneOtp, signInWithLinkedIdentity } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const identityProvider = platformIdentityProvider();

  const onIdentity = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithLinkedIdentity();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('errors:IDENTITY_TOKEN_INVALID'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const phoneReady = phone.replace(/\D/g, '').length >= 10;

  const onSignUp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const e164 = normalizeTrPhone(phone);
      const { challengeId } = await requestPhoneOtp(e164, 'register');
      navigation.navigate('AuthOtp', {
        challengeId,
        phone: e164,
        purpose: 'register',
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'PASSWORD_REQUIRED') {
        navigation.navigate('AuthPassword', {
          mode: 'login',
          phone: normalizeTrPhone(phone),
        });
        return;
      }
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSignIn = () => {
    setError(null);
    navigation.navigate('AuthPassword', {
      mode: 'login',
      phone: normalizeTrPhone(phone),
    });
  };

  return (
    <ModulePage title={t('auth:phone.title')} testID={SCREEN_IDS.phone} scroll>
      
      <Text className="font-sans mt-2 text-base text-text-medium">
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
      <Text className="font-sans mb-4 text-sm text-text-low">{t('auth:phone.legalHint')}</Text>
      <Button
        disabled={submitting || !phoneReady}
        label={t('auth:phone.signUp')}
        onPress={() => void onSignUp()}
        testID="auth-phone-continue"
      />
      <Button
        disabled={submitting || !phoneReady}
        label={t('auth:phone.signIn')}
        onPress={onSignIn}
        testID="auth-phone-signin"
        variant="secondary"
      />
      {identityProvider ? (
        <Button
          disabled={submitting}
          label={
            identityProvider === 'apple'
              ? t('auth:identity.appleLogin')
              : t('auth:identity.googleLogin')
          }
          onPress={() => void onIdentity()}
          testID="auth-identity-login"
          variant="secondary"
        />
      ) : null}
      <Button
        label={t('auth:phone.openPolicies')}
        onPress={() => navigation.navigate('AuthPolicies')}
        variant="secondary"
      />
    </ModulePage>
  );
}
