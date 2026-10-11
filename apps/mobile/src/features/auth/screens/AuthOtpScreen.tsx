import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthOtp'>;

const RESEND_SECONDS = 45;
const CODE_LENGTH = 6;

function maskTrPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '').replace(/^90/, '');
  if (digits.length < 10) {
    return e164;
  }
  return `+90 ${digits.slice(0, 3)} ••• •• ${digits.slice(8)}`;
}

export function AuthOtpScreen({ navigation, route }: Props) {
  const { challengeId, phone, purpose } = route.params;
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { requestPhoneOtp, verifyPhoneOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onVerify = async (nextCode = code) => {
    if (nextCode.length !== CODE_LENGTH || submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await verifyPhoneOtp(challengeId, nextCode, { holdPhase: true });
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

  const onChangeCode = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setError(null);
    setCode(next);
    if (next.length === CODE_LENGTH) {
      void onVerify(next);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0) {
      return;
    }
    setError(null);
    try {
      const next = await requestPhoneOtp(phone, purpose);
      navigation.setParams({ challengeId: next.challengeId });
      setCode('');
      setSecondsLeft(RESEND_SECONDS);
      inputRef.current?.focus();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      }
    }
  };

  return (
    <ModulePage
      eyebrow={maskTrPhone(phone)}
      hero={
        <Text className="mt-3 font-sans text-base leading-6 text-text-on">
          {t('auth:otp.subtitle', { phone: maskTrPhone(phone) })}
        </Text>
      }
      scroll
      testID={SCREEN_IDS.otp}
      title={
        purpose === 'password_reset' ? t('auth:otp.resetTitle') : t('auth:otp.signupTitle')
      }
    >
      {purpose === 'password_reset' ? (
        <Text className="font-sans text-sm leading-5 text-text-low">
          {t('auth:otp.resetHint')}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={t('auth:otp.codeLabel')}
        onPress={() => inputRef.current?.focus()}
      >
        <View
          className={`h-16 flex-row items-center overflow-hidden rounded-[22px] bg-surface-1 ${
            error ? 'border border-feedback-error' : ''
          }`}
        >
          {Array.from({ length: CODE_LENGTH }, (_, index) => {
            const digit = code[index] ?? '';
            const active =
              index === code.length || (code.length === CODE_LENGTH && index === CODE_LENGTH - 1);
            return (
              <View
                key={index}
                className={`h-16 flex-1 items-center justify-center ${
                  index > 0 ? 'border-l border-surface-2' : ''
                } ${active && !error ? 'bg-surface-base' : ''}`}
              >
                <Text className="font-display text-2xl font-semibold text-text-high">{digit}</Text>
                {active && !digit ? (
                  <View className="absolute bottom-3 h-0.5 w-4 rounded-full bg-action-primary" />
                ) : null}
              </View>
            );
          })}
        </View>
      </Pressable>
      <TextInput
        ref={inputRef}
        accessibilityLabel={t('auth:otp.codeLabel')}
        autoFocus
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        onChangeText={onChangeCode}
        testID="auth-otp-input"
        textContentType="oneTimeCode"
        value={code}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
      {error ? (
        <Text className="font-sans text-sm text-feedback-error">{error}</Text>
      ) : (
        <Text className="font-sans text-sm text-text-low">{t('auth:otp.codeLabel')}</Text>
      )}
      <Button
        disabled={submitting || code.length !== CODE_LENGTH}
        label={submitting ? t('common:loading') : t('common:continue')}
        onPress={() => void onVerify()}
        shape="capsule"
      />
      <Button
        disabled={secondsLeft > 0}
        label={
          secondsLeft > 0
            ? t('auth:otp.resendWait', { seconds: secondsLeft })
            : t('auth:otp.resend')
        }
        onPress={() => void onResend()}
        shape="capsule"
        variant="ghost"
      />
      <Button
        label={t('auth:otp.changeNumber')}
        onPress={() => navigation.goBack()}
        shape="capsule"
        variant="ghost"
      />
    </ModulePage>
  );
}
