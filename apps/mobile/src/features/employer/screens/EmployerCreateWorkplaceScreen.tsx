import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { createEmployer } from '../../../api/employers-api';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { CityChips } from '../../../components/ui/CityChips';
import { LocationMap } from '../../../components/map/LocationMap';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardShell } from '../../../components/ui/WizardShell';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerCreateWorkplace'
>;

export function EmployerCreateWorkplaceScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'employer', 'common', 'errors']);
  const { applyEmployerCreate } = useAuth();
  const [step, setStep] = useState(0);
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);

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
    if (
      !addressLine1.trim() ||
      !city.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setError(t('onboarding:employer.locationIncomplete'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const result = await createEmployer(
        {
          legalName,
          tradingName: tradingName || undefined,
          taxId,
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          latitude: lat,
          longitude: lng,
        },
        token,
      );
      await applyEmployerCreate(result);
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage
      back={step > 0 ? () => setStep(0) : 'auto'}
      scroll
      testID="m.employer.business.create-workplace"
      title={t('employer:business.addWorkplace')}
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('onboarding:employer.wizard.identity')
            : t('onboarding:employer.wizard.location')
        }
        hint={
          step === 0
            ? t('onboarding:employer.wizard.identityHint')
            : t('onboarding:employer.wizard.locationHint')
        }
        primaryDisabled={submitting}
        primaryLabel={t('common:continue')}
        step={step + 1}
        total={2}
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
            <LocationMap
              pin={
                Number.isFinite(lat) && Number.isFinite(lng)
                  ? { latitude: lat, longitude: lng }
                  : null
              }
              pinLabel={legalName || undefined}
              radiusM={radii?.radiusM}
              softRadiusM={radii?.softRadiusM}
              locateMoment="pin-pick"
              onPick={(pin) => {
                setLatitude(String(pin.latitude));
                setLongitude(String(pin.longitude));
              }}
            />
          </View>
        )}
      </WizardShell>
    </ModulePage>
  );
}
