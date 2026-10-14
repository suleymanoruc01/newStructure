import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPassword'>;

export function AuthPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const {
    loginWithPassword,
    onboardingKind,
    phase,
    requestPhoneOtp,
    saveSignupPassword,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const params = route.params;
  const mode = params?.mode;
  const phone = params && params.mode === 'login' ? params.phone : '';

  useEffect(() => {
    if (phase === 'booting' || phase === 'unauthenticated' || phase === 'authenticated') {
      return;
    }
    if (phase === 'needs_role') {
      navigation.replace('AuthRoleSelect');
      return;
    }
    if (phase === 'needs_policies') {
      navigation.replace('AuthPolicies');
      return;
    }
    if (phase === 'needs_onboarding') {
      if (onboardingKind === 'worker') {
        navigation.replace('WorkerOnboardingProfile');
        return;
      }
      if (onboardingKind === 'manager') {
        navigation.replace('ManagerOnboardingJoin');
        return;
      }
      if (onboardingKind === 'employer') {
        navigation.replace('EmployerOnboardingBusiness');
      }
      return;
    }
    const unreachable: never = phase;
    return unreachable;
  }, [navigation, onboardingKind, phase]);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'set') {
        await saveSignupPassword(password);
        return;
      }
      const signedIn = await loginWithPassword(phone, password);
      if (signedIn.nextRoute) {
        navigation.replace(signedIn.nextRoute);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (mode === 'login' && err.code === 'UNAUTHORIZED') {
          setError(err.message || 'Telefon veya şifre hatalı.');
        } else {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        }
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    if (mode !== 'login') {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { challengeId } = await requestPhoneOtp(
        phone,
        'password_reset',
      );
      navigation.navigate('AuthOtp', {
        challengeId,
        phone,
        purpose: 'password_reset',
      });
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

  const setting = mode === 'set';
  const recovering = params?.mode === 'set' && params.purpose === 'password_reset';
  const title = !setting
    ? t('auth:password.loginTitle')
    : recovering
      ? t('auth:password.resetTitle')
      : t('auth:password.setTitle');
  const subtitle = !setting
    ? t('auth:password.loginSubtitle')
    : recovering
      ? t('auth:password.resetSubtitle')
      : t('auth:password.setSubtitle');

  return (
    <ModulePage
      eyebrow="PartOn"
      hero={<Text className="mt-3 font-sans text-base leading-6 text-text-on">{subtitle}</Text>}
      scroll
      testID={
        recovering
          ? SCREEN_IDS.passwordReset
          : setting
            ? SCREEN_IDS.passwordSet
            : 'auth-password-login'
      }
      title={title}
    >
      <View className="mb-3">
        <StatusBadge
          label={
            password.length >= 8
              ? t('auth:password.ready')
              : t('auth:password.needChars')
          }
          tone={password.length >= 8 ? 'strong' : 'warn'}
        />
      </View>
      <TextField
        autoCapitalize="none"
        error={error}
        inset
        label={t('auth:password.label')}
        onChangeText={setPassword}
        secureTextEntry
        testID="auth-password-input"
        value={password}
      />
      <Button
        disabled={submitting || password.length < 8}
        label={t('common:continue')}
        onPress={() => void onSubmit()}
        shape="capsule"
      />
      {mode === 'login' ? (
        <Button
          disabled={submitting}
          label={t('auth:password.forgot')}
          onPress={() => void onForgot()}
          testID="auth-password-forgot"
          variant="ghost"
        />
      ) : null}
      <Button
        label={t('auth:password.changeNumber')}
        onPress={() => navigation.navigate('AuthPhone')}
        variant="ghost"
      />
    </ModulePage>
  );
}
