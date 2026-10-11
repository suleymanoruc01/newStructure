import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { topUpTokens } from '../../../api/tokens-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { PaymentMethodList } from '../components/tokens/PaymentMethodList';
import { TopUpAmountPicker } from '../components/tokens/TopUpAmountPicker';
import { TopUpConfirmSheet } from '../components/tokens/TopUpConfirmSheet';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerTokenTopUp'
>;

export function EmployerTokenTopUpScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [amount, setAmount] = useState<number | null>(25);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const runTopUp = async (paymentOutcome: 'approve' | 'cancel') => {
    if (!amount) {
      setError(t('employer:tokens.pickAmount'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (paymentOutcome === 'cancel') {
        setConfirmOpen(false);
        setError(t('employer:tokens.paymentCancelled'));
        return;
      }
      const idem = `topup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await topUpTokens(
        { amount, paymentOutcome: 'approve' },
        token,
        idem,
      );
      setConfirmOpen(false);
      setSuccess(
        t('employer:tokens.topUpSuccess', { balance: result.balance }),
      );
      setTimeout(() => {
        navigation.navigate('EmployerTokensRoot');
      }, 1200);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID="m.employer.tokens.top-up">
      <Text className="text-2xl font-bold text-text-high">
        {t('employer:tokens.topUpTitle')}
      </Text>
      <Text className="mt-2 text-base text-text-medium">
        {t('employer:tokens.topUpLead')}
      </Text>
      <View className="mt-6">
        <TopUpAmountPicker
          selected={amount}
          onSelect={setAmount}
          labelFor={(n) => t('employer:tokens.packageLabel', { count: n })}
        />
      </View>
      <View className="mt-8">
        <PaymentMethodList
          selected="sandbox_card"
          onSelect={() => undefined}
          title={t('employer:tokens.paymentMethodTitle')}
          sandboxLabel={t('employer:tokens.sandboxCard')}
        />
      </View>
      <View className="mt-8">
        <Text
          className="text-center text-base font-semibold text-brand-primary"
          onPress={() => {
            if (!amount) {
              setError(t('employer:tokens.pickAmount'));
              return;
            }
            setConfirmOpen(true);
          }}
        >
          {t('employer:tokens.continueToPay')}
        </Text>
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {success ? (
        <Text className="mt-4 text-sm text-feedback-success">{success}</Text>
      ) : null}
      <TopUpConfirmSheet
        visible={confirmOpen}
        amountLabel={
          amount
            ? t('employer:tokens.packageLabel', { count: amount })
            : ''
        }
        title={t('employer:tokens.confirmTitle')}
        body={t('employer:tokens.confirmBody')}
        confirmLabel={
          submitting
            ? t('common:loading')
            : t('employer:tokens.confirmPay')
        }
        cancelLabel={t('common:cancel')}
        onConfirm={() => void runTopUp('approve')}
        onCancel={() => void runTopUp('cancel')}
      />
    </Screen>
  );
}
