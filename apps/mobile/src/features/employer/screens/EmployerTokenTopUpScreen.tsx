import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchPlatformRemoteConfig } from '../../../api/platform-api';
import { fetchTokenPackages, topUpTokens } from '../../../api/tokens-api';
import { purchaseAdaptyProduct } from '../../../payments/adapty';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { WizardShell } from '../../../components/ui/WizardShell';
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
  const [step, setStep] = useState(0);
  const [adaptyEnabled, setAdaptyEnabled] = useState(false);
  const [adaptyPlacementId, setAdaptyPlacementId] = useState('');
  const [method, setMethod] = useState<'apple' | 'google' | 'sandbox_card'>(
    'sandbox_card',
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const [list, platform] = await Promise.all([
          fetchTokenPackages(token),
          fetchPlatformRemoteConfig(),
        ]);
        setAdaptyEnabled(platform.adaptyEnabled);
        setAdaptyPlacementId(platform.adaptyPlacementId);
        setMethod(
          platform.adaptyEnabled
            ? Platform.OS === 'ios'
              ? 'apple'
              : 'google'
            : 'sandbox_card',
        );
        const mapped = (list.items ?? []).map((item) => ({
          id: item.id,
          label: item.label,
          tokenCount: item.tokenCount,
          priceTry: item.priceTry,
          isPopular: item.isPopular,
          iosProductId: item.iosProductId,
          androidProductId: item.androidProductId,
          adaptyProductId: item.adaptyProductId,
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
      let adaptyTransactionId: string | undefined;
      if (adaptyEnabled) {
        if (
          !adaptyPlacementId ||
          !(selected.iosProductId || selected.androidProductId || selected.adaptyProductId)
        ) {
          setError(t('employer:tokens.storeProductMissing'));
          return;
        }
        const purchased = await purchaseAdaptyProduct({
          placementId: adaptyPlacementId,
          iosProductId: selected.iosProductId ?? '',
          androidProductId: selected.androidProductId ?? '',
          adaptyProductId: selected.adaptyProductId ?? '',
        });
        if ('cancelled' in purchased) {
          setConfirmOpen(false);
          setError(t('employer:tokens.paymentCancelled'));
          return;
        }
        adaptyTransactionId = purchased.transactionId;
      }
      const result = await topUpTokens(
        {
          packageId: selected.id,
          paymentOutcome: adaptyEnabled ? undefined : 'approve',
          adaptyTransactionId,
        },
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
    <ModulePage
      back={step > 0 ? () => setStep(0) : 'auto'}
      scroll
      testID="m.employer.tokens.top-up"
      title={t('employer:tokens.topUpTitle')}
    >
      <WizardShell
        error={error}
        extraFooter={
          success ? <StatusBadge label={success} tone="strong" /> : null
        }
        heading={
          step === 0
            ? t('employer:tokens.wizard.package')
            : t('employer:tokens.wizard.pay')
        }
        hint={
          step === 0
            ? t('employer:tokens.wizard.packageHint')
            : t('employer:tokens.wizard.payHint')
        }
        primaryDisabled={loading}
        primaryLabel={
          step === 0
            ? t('common:continue')
            : t('employer:tokens.continueToPay')
        }
        step={step + 1}
        total={2}
        onPrimary={() => {
          if (!selected) {
            setError(t('employer:tokens.pickAmount'));
            return;
          }
          if (step === 0) {
            setError(null);
            setStep(1);
            return;
          }
          setConfirmOpen(true);
        }}
      >
        {loading ? <SkeletonList /> : null}
        {selected ? (
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
        ) : null}
        {step === 0 ? (
          <View className="gap-3">
            {!loading && packages.length === 0 ? (
              <EmptyState title={t('employer:tokens.pickAmount')} />
            ) : null}
            <TopUpAmountPicker
              packages={packages}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              priceLabelFor={(price) =>
                t('employer:tokens.priceTry', { price })
              }
            />
          </View>
        ) : (
          <View className="gap-3">
            <PaymentMethodList
              selected={method}
              onSelect={setMethod}
              title={t('employer:tokens.paymentMethodTitle')}
              appleLabel={t('employer:tokens.applePay')}
              googleLabel={t('employer:tokens.googlePay')}
              sandboxLabel={t('employer:tokens.sandboxCard')}
              adaptyEnabled={adaptyEnabled}
            />
            {!adaptyEnabled ? (
              <EmptyState title={t('employer:tokens.adaptyOffHint')} />
            ) : null}
          </View>
        )}
      </WizardShell>
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
