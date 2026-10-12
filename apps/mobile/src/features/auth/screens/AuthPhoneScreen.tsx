import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ClayCard } from '../../../components/ui/ClayCard';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { IdentitySignInButton } from '../components/IdentitySignInButton';
import { platformIdentityProvider } from '../linked-sign-in';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPhone'>;

function nationalDigits(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('90')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function formatNational(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)]
    .filter((part) => part.length > 0)
    .join(' ');
}

function toE164(digits: string): string {
  return `+90${digits}`;
}

export function AuthPhoneScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { requestPhoneOtp, signInWithLinkedIdentity } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const identityProvider = platformIdentityProvider();
  const digits = nationalDigits(phone);
  const phoneReady = digits.length === 10;

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

  const onSignUp = async () => {
    if (!phoneReady) {
      setError(t('auth:phone.needPhone'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const e164 = toE164(digits);
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
          phone: toE164(digits),
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
    if (!phoneReady) {
      setError(t('auth:phone.needPhone'));
      return;
    }
    setError(null);
    navigation.navigate('AuthPassword', {
      mode: 'login',
      phone: toE164(digits),
    });
  };

  return (
    <ModulePage
      eyebrow="PartOn"
      hero={
        <Text className="mt-3 font-sans text-base leading-6 text-text-on">
          {t('auth:phone.subtitle')}
        </Text>
      }
      scroll
      testID={SCREEN_IDS.phone}
      title={t('auth:phone.title')}
    >
      <View className="flex-1">
      <View>
      <TextField
        autoFocus
        error={error}
        keyboardType="phone-pad"
        label={t('auth:phone.phoneLabel')}
        maxLength={13}
        onChangeText={(value) => {
          setError(null);
          setPhone(formatNational(nationalDigits(value)));
        }}
        placeholder={t('auth:phone.phonePlaceholder')}
        prefix="+90"
        testID="auth-phone-input"
        value={phone}
      />
      <View className="mt-4 gap-3">
        <Button
          disabled={submitting}
          label={t('auth:phone.signUp')}
          onPress={() => void onSignUp()}
          testID="auth-phone-continue"
        />
        <Button
          disabled={submitting}
          label={t('auth:phone.signIn')}
          onPress={onSignIn}
          testID="auth-phone-signin"
          variant="secondary"
        />
        {identityProvider ? (
          <IdentitySignInButton
            disabled={submitting}
            onPress={() => void onIdentity()}
            provider={identityProvider}
            testID="auth-identity-login"
          />
        ) : null}
      </View>
      </View>
      <View className="min-h-8 flex-1" />
      <ClayCard onPress={() => navigation.navigate('AuthPolicies')}>
        <Text className="font-sans text-sm leading-5 text-text-medium">
          {t('auth:phone.legalHint')}
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="font-sans text-base font-semibold text-text-high">
            {t('auth:phone.openPolicies')}
          </Text>
          <Text className="font-sans text-xl text-text-low">›</Text>
        </View>
      </ClayCard>
      </View>
    </ModulePage>
  );
}
