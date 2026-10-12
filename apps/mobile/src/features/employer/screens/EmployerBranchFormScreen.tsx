import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { createBranch, getBranch, patchBranch } from '../../../api/branches-api';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { JobCard } from '../../../components/job/JobCard';
import { LocationMap } from '../../../components/map/LocationMap';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { CityChips } from '../../../components/ui/CityChips';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { WizardShell } from '../../../components/ui/WizardShell';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerBranchForm'>;

export function EmployerBranchFormScreen({ route, navigation }: Props) {
  const branchId = route.params?.branchId;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  useEffect(() => {
    if (!branchId) {
      return;
    }
    void (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const branch = await getBranch(branchId, token);
        setName(branch.name);
        setAddressLine1(branch.addressLine1 ?? '');
        setCity(branch.city ?? '');
        setLatitude(String(branch.latitude));
        setLongitude(String(branch.longitude));
        setInvite(branch.managerInviteCode ?? null);
      } catch (err) {
        setError(formErrorMessage(err, t));
      }
    })();
  }, [branchId, t]);

  const onSubmit = async () => {
    if (step === 0) {
      if (!name.trim()) {
        setError(t('employer:branches.detailsIncomplete'));
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
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new ApiClientError(
          t('employer:branches.coordsInvalid'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const body = {
        name,
        addressLine1: addressLine1.trim() || undefined,
        city: city.trim() || undefined,
        latitude: lat,
        longitude: lng,
      };
      if (branchId) {
        await patchBranch(branchId, body, token);
      } else {
        await createBranch(body, token);
      }
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);

  return (
    <ModulePage
      back={step > 0 ? () => setStep(0) : 'auto'}
      scroll
      testID="m.employer.branches.form"
      title={
        branchId ? t('employer:branches.editTitle') : t('employer:branches.createTitle')
      }
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('employer:branches.wizard.details')
            : t('employer:branches.wizard.pin')
        }
        hint={
          step === 0
            ? t('employer:branches.wizard.detailsHint')
            : t('employer:branches.wizard.pinHint')
        }
        primaryDisabled={submitting}
        primaryLabel={t('common:continue')}
        step={step + 1}
        total={2}
        onPrimary={() => void onSubmit()}
      >
        {step === 0 ? (
          <View className="gap-3">
            {invite ? (
              <JobCard title={t('employer:branches.editTitle')}>
                <StatusBadge
                  label={t('employer:branches.invite', { code: invite })}
                  tone="warn"
                />
              </JobCard>
            ) : null}
            <TextField
              label={t('employer:branches.name')}
              value={name}
              onChangeText={setName}
            />
            <TextField
              label={t('employer:branches.address')}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />
            <CityChips
              label={t('employer:branches.city')}
              value={city}
              onChange={setCity}
            />
          </View>
        ) : (
          <View className="gap-3">
            <Text className="font-sans text-sm text-text-medium">
              {t('employer:branches.tapToPin')}
            </Text>
            <LocationMap
              pin={
                Number.isFinite(lat) && Number.isFinite(lng)
                  ? { latitude: lat, longitude: lng }
                  : null
              }
              pinLabel={name || undefined}
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
