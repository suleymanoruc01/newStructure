import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchTokenPackages, topUpTokens } from '../../../api/tokens-api';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { PaymentMethodList } from '../components/tokens/PaymentMethodList';
import {
  TopUpAmountPicker,
  type TopUpPackageOption,
} from '../components/tokens/TopUpAmountPicker';
import { TopUpConfirmSheet } from '../components/tokens/TopUpConfirmSheet';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerTokenTopUp'
>;

export function EmployerTokenTopUpScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [packages, setPackages] = useState<TopUpPackageOption[]>([]);
  const [selected, setSelected] = useState<TopUpPackageOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const list = await fetchTokenPackages(token);
        const mapped = list.items.map((item) => ({
          id: item.id,
          label: item.label,
          tokenCount: item.tokenCount,
          priceTry: item.priceTry,
          isPopular: item.isPopular,
        }));
        setPackages(mapped);
        const popular = mapped.find((p) => p.isPopular) ?? mapped[0] ?? null;
        setSelected(popular);
      } catch {
        setError(t('common:networkError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const runTopUp = async (paymentOutcome: 'approve' | 'cancel') => {
    if (!selected) {
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
        { packageId: selected.id, paymentOutcome: 'approve' },
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
    <ModulePage title={t('employer:tokens.topUpTitle')} testID="m.employer.tokens.top-up" scroll>
      
      {loading ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {selected ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('employer:tokens.packageLabel', {
                  count: selected.tokenCount,
                }),
                value: t('employer:tokens.priceTry', {
                  price: selected.priceTry,
                }),
              },
            ]}
          />
        </View>
      ) : null}
      {!loading && packages.length === 0 ? (
        <View className="mt-4">
          <EmptyState title={t('employer:tokens.pickAmount')} />
        </View>
      ) : null}
      <View className="mt-2">
        <TopUpAmountPicker
          packages={packages}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          priceLabelFor={(price) =>
            t('employer:tokens.priceTry', { price })
          }
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
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6">
        <Button
          label={t('employer:tokens.continueToPay')}
          onPress={() => {
            if (!selected) {
              setError(t('employer:tokens.pickAmount'));
              return;
            }
            setConfirmOpen(true);
          }}
        />
      </View>
      {success ? (
        <View className="mt-4">
          <StatusBadge label={success} tone="strong" />
        </View>
      ) : null}
      <TopUpConfirmSheet
        visible={confirmOpen}
        amountLabel={
          selected
            ? `${selected.label} · ${t('employer:tokens.priceTry', { price: selected.priceTry })}`
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
    </ModulePage>
  );
}
