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

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPassword'>;

export function AuthPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { loginWithPassword, requestPhoneOtp, saveSignupPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mode = route.params.mode;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'set') {
        const saved = await saveSignupPassword(password);
        navigation.replace(
          saved && saved.roles.length > 0 ? 'AuthPolicies' : 'AuthRoleSelect',
        );
        return;
      }
      const user = await loginWithPassword(route.params.phone, password);
      navigation.replace(
        user.roles.length === 0 ? 'AuthRoleSelect' : 'AuthPolicies',
      );
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

  const onForgot = async () => {
    if (mode !== 'login') {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { challengeId } = await requestPhoneOtp(
        route.params.phone,
        'password_reset',
      );
      navigation.navigate('AuthOtp', {
        challengeId,
        phone: route.params.phone,
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
  const recovering = setting && route.params.purpose === 'password_reset';
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
      title={title}
      testID={
        recovering
          ? SCREEN_IDS.passwordReset
          : setting
            ? SCREEN_IDS.passwordSet
            : 'auth-password-login'
      }
      scroll
    >
      <Text className="font-sans mt-2 text-base text-text-medium">{subtitle}</Text>
      <TextField
        autoCapitalize="none"
        label={t('auth:password.label')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error}
        testID="auth-password-input"
      />
      <Button
        disabled={submitting || password.length < 8}
        label={t('common:continue')}
        onPress={() => void onSubmit()}
      />
      {mode === 'login' ? (
        <Button
          label={t('auth:password.forgot')}
          onPress={() => void onForgot()}
          testID="auth-password-forgot"
          variant="secondary"
        />
      ) : null}
      <Button
        label={t('auth:password.changeNumber')}
        onPress={() => navigation.navigate('AuthPhone')}
        variant="secondary"
      />
    </ModulePage>
  );
}
