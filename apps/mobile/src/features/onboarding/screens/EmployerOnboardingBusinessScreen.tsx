import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardSteps } from '../../../components/ui/WizardSteps';
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
      .then((catalog) => setSectors(catalog.sectors))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = needle
    ? sectors.filter(
        (sector) =>
          sector.displayName.toLocaleLowerCase('tr-TR').includes(needle) ||
          sector.code.toLocaleLowerCase('tr-TR').includes(needle),
      )
    : sectors;

  const onSubmit = async () => {
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
      applyEmployerCreate(result);
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
    <ModulePage title={t('onboarding:employer.businessTitle')} testID={ONBOARDING_SCREEN_IDS.employerBusiness} scroll>
      <WizardSteps step={1} total={2} />
      {employerId ? null : (
        <Text className="font-sans mt-2 text-base text-text-medium">
          {t('onboarding:employer.businessSubtitle')}
        </Text>
      )}
      <View className="mt-6 gap-3">
        {employerId ? null : (
          <>
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
              label={t('onboarding:employer.taxId')}
              value={taxId}
              onChangeText={setTaxId}
              keyboardType="number-pad"
            />
          </>
        )}
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
          {shownSectors.map((sector) => {
            const on = industryCodes.includes(sector.code);
            return (
              <Pressable
                key={sector.code}
                className={`rounded-full px-3 py-2 ${
                  on ? 'bg-action-primary' : 'bg-surface-1'
                }`}
                onPress={() =>
                  setIndustryCodes((current) =>
                    current.includes(sector.code)
                      ? current.filter((code) => code !== sector.code)
                      : [...current, sector.code],
                  )
                }
              >
                <Text
                  className={`font-sans text-sm ${
                    on ? 'text-text-on' : 'text-text-high'
                  }`}
                >
                  {sector.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {needle && shownSectors.length === 0 ? (
          <EmptyState title={t('employer:industry.searchEmpty')} />
        ) : null}
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6">
        <Button
          disabled={submitting}
          label={t('common:continue')}
          onPress={() => void onSubmit()}
        />
      </View>
    </ModulePage>
  );
}
