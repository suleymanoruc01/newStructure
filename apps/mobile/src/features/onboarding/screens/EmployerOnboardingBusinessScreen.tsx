import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ClayChip } from '../../../components/ui/ClayChip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardShell } from '../../../components/ui/WizardShell';
import { ApiClientError } from '../../../api/client';
import { createEmployer, patchEmployerMe } from '../../../api/employers-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { postLoginRoute } from '../../../shared/auth/auth-gate';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'EmployerOnboardingBusiness'
>;

export function EmployerOnboardingBusinessScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'employer', 'common', 'errors']);
  const { applyEmployerCreate, completeOnboarding, contexts } = useAuth();
  const employerId = contexts.find((item) => item.role === 'employer')?.employerId;
  const [step, setStep] = useState(employerId ? 1 : 0);
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industryCodes, setIndustryCodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetchJobCatalog()
      .then((catalog) => setSectors(catalog.sectors ?? []))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = needle
    ? sectors.filter(
        (sector) =>
          (sector.displayName ?? '').toLocaleLowerCase('tr-TR').includes(needle) ||
          (sector.code ?? '').toLocaleLowerCase('tr-TR').includes(needle),
      )
    : sectors;

  const onSubmit = async () => {
    if (step === 0) {
      if (!legalName.trim() || !taxId.trim()) {
        setError(t('onboarding:employer.identityIncomplete'));
        return;
      }
      setError(null);
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const industries = industryCodes;
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (employerId) {
        await patchEmployerMe({ industryCodes: industries }, token);
        const gate = await completeOnboarding();
        const next = postLoginRoute(gate);
        if (!next) {
          return;
        }
        navigation.replace(
          next === 'EmployerOnboardingBusiness'
            ? 'EmployerOnboardingBranch'
            : next,
        );
        return;
      }
      const result = await createEmployer(
        {
          legalName,
          tradingName: tradingName || undefined,
          taxId,
          industryCodes: industries,
        },
        token,
      );
      await applyEmployerCreate(result);
      navigation.replace('EmployerOnboardingBranch');
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

  return (
    <ModulePage
      back={step > 0 && !employerId ? () => setStep(0) : 'auto'}
      scroll
      testID={ONBOARDING_SCREEN_IDS.employerBusiness}
      title={t('onboarding:employer.businessTitle')}
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('onboarding:employer.wizard.identity')
            : t('onboarding:employer.wizard.industries')
        }
        hint={
          step === 0
            ? t('onboarding:employer.wizard.identityHint')
            : t('onboarding:employer.wizard.industriesHint')
        }
        primaryDisabled={submitting}
        primaryLabel={t('common:continue')}
        step={step + 1}
        total={4}
        onPrimary={() => void onSubmit()}
      >
        {step === 0 ? (
          <View className="gap-3">
            <TextField
              label={t('onboarding:employer.legalName')}
              value={legalName}
              onChangeText={setLegalName}
            />
            <TextField
              label={t('onboarding:employer.tradingName')}
              value={tradingName}
              onChangeText={setTradingName}
            />
            <TextField
              keyboardType="number-pad"
              label={t('onboarding:employer.taxId')}
              value={taxId}
              onChangeText={setTaxId}
            />
          </View>
        ) : (
          <View className="gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('onboarding:employer.industries')}
            </Text>
            {sectors.length > 6 ? (
              <TextField
                label={t('employer:industry.search')}
                value={query}
                onChangeText={setQuery}
              />
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {shownSectors.map((sector) => (
                <ClayChip
                  key={sector.code}
                  label={sector.displayName}
                  selected={industryCodes.includes(sector.code)}
                  onPress={() =>
                    setIndustryCodes((current) =>
                      current.includes(sector.code)
                        ? current.filter((code) => code !== sector.code)
                        : [...current, sector.code],
                    )
                  }
                />
              ))}
            </View>
            {needle && shownSectors.length === 0 ? (
              <EmptyState title={t('employer:industry.searchEmpty')} />
            ) : null}
          </View>
        )}
      </WizardShell>
    </ModulePage>
  );
}
