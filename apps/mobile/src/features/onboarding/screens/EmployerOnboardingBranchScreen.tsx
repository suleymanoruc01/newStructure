import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { LocationMap } from '../../../components/map/LocationMap';
import { CityChips } from '../../../components/ui/CityChips';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardShell } from '../../../components/ui/WizardShell';
import { ApiClientError } from '../../../api/client';
import { createBranch } from '../../../api/branches-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { continueAfterGate } from '../../../shared/auth/auth-gate';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'EmployerOnboardingBranch'
>;

export function EmployerOnboardingBranchScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'common', 'errors']);
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);

  const onSubmit = async () => {
    if (step === 0) {
      if (!name.trim() || !addressLine1.trim() || !city.trim()) {
        setError(t('onboarding:employer.branchIncomplete'));
        return;
      }
      setError(null);
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new ApiClientError(
          t('onboarding:employer.invalidCoords'),
          400,
          'VALIDATION_FAILED',
        );
      }
      await createBranch(
        {
          name,
          addressLine1,
          city,
          latitude: lat,
          longitude: lng,
        },
        token,
      );
      continueAfterGate(navigation, await completeOnboarding());
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
      back={step > 0 ? () => setStep(0) : 'auto'}
      scroll
      testID={ONBOARDING_SCREEN_IDS.employerBranch}
      title={t('onboarding:employer.branchTitle')}
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('onboarding:employer.wizard.branch')
            : t('onboarding:employer.wizard.pin')
        }
        hint={
          step === 0
            ? t('onboarding:employer.wizard.branchHint')
            : t('onboarding:employer.wizard.pinHint')
        }
        primaryDisabled={submitting}
        primaryLabel={
          step === 0
            ? t('common:continue')
            : t('onboarding:employer.finish')
        }
        step={step + 3}
        total={4}
        onPrimary={() => void onSubmit()}
      >
        {step === 0 ? (
          <View className="gap-3">
            <TextField
              label={t('onboarding:employer.branchName')}
              value={name}
              onChangeText={setName}
            />
            <TextField
              label={t('onboarding:employer.address')}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />
            <CityChips
              label={t('onboarding:employer.city')}
              value={city}
              onChange={setCity}
            />
          </View>
        ) : (
          <LocationMap
            pin={
              Number.isFinite(lat) && Number.isFinite(lng)
                ? { latitude: lat, longitude: lng }
                : null
            }
            pinLabel={name || undefined}
            locateMoment="pin-pick"
            onPick={(pin) => {
              setLatitude(String(pin.latitude));
              setLongitude(String(pin.longitude));
            }}
          />
        )}
      </WizardShell>
    </ModulePage>
  );
}
