import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import {
  patchWorkerProfile,
  putWorkerAvailability,
} from '../../../api/workers-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { continueAfterGate } from '../../../shared/auth/auth-gate';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WorkerOnboardingProfile'
>;

const DEFAULT_WINDOWS = [
  { dayOfWeek: 1, startMinute: 540, endMinute: 1020 },
  { dayOfWeek: 2, startMinute: 540, endMinute: 1020 },
  { dayOfWeek: 3, startMinute: 540, endMinute: 1020 },
  { dayOfWeek: 4, startMinute: 540, endMinute: 1020 },
  { dayOfWeek: 5, startMinute: 540, endMinute: 1020 },
];

export function WorkerOnboardingProfileScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'common', 'errors']);
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'unspecified'>(
    'unspecified',
  );
  const [homeLat, setHomeLat] = useState('41.0082');
  const [homeLng, setHomeLng] = useState('28.9784');
  const [nightShift, setNightShift] = useState(false);
  const [sectorCodes, setSectorCodes] = useState('hospitality');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const lat = Number.parseFloat(homeLat);
      const lng = Number.parseFloat(homeLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new ApiClientError(
          t('onboarding:worker.invalidCoords'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const sectors = sectorCodes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await patchWorkerProfile(
        {
          firstName,
          lastName,
          birthDate,
          gender,
          homeLatitude: lat,
          homeLongitude: lng,
          nightShiftAvailable: nightShift,
          sectorCodes: sectors,
        },
        token,
      );
      await putWorkerAvailability({ windows: DEFAULT_WINDOWS }, token);
      continueAfterGate(navigation, await completeOnboarding());
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage
      back={step > 0 ? () => setStep(step - 1) : 'auto'}
      eyebrow={t('onboarding:worker.step', { current: step + 1, total: 3 })}
      scroll
      testID={ONBOARDING_SCREEN_IDS.workerProfile}
      title={t('onboarding:worker.title')}
    >
      {step === 0 ? (
        <View className="mt-6 gap-3">
          <TextField
            label={t('onboarding:worker.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextField
            label={t('onboarding:worker.lastName')}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <TextField
            label={t('onboarding:worker.birthDate')}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            label={t('onboarding:worker.gender')}
            value={gender}
            onChangeText={(v) =>
              setGender(
                v === 'female' || v === 'male' || v === 'other'
                  ? v
                  : 'unspecified',
              )
            }
            placeholder="female | male | other"
          />
        </View>
      ) : null}
      {step === 1 ? (
        <View className="mt-6 gap-3">
          <TextField
            label={t('onboarding:worker.sectors')}
            value={sectorCodes}
            onChangeText={setSectorCodes}
            placeholder="hospitality, retail"
          />
          <Button
            label={
              nightShift
                ? t('onboarding:worker.nightShiftOn')
                : t('onboarding:worker.nightShiftOff')
            }
            onPress={() => setNightShift(!nightShift)}
            variant="secondary"
          />
          <TextField
            label={t('onboarding:worker.latitude')}
            value={homeLat}
            onChangeText={setHomeLat}
            keyboardType="decimal-pad"
            error={
              error === t('onboarding:worker.invalidCoords') ? error : undefined
            }
          />
          <TextField
            label={t('onboarding:worker.longitude')}
            value={homeLng}
            onChangeText={setHomeLng}
            keyboardType="decimal-pad"
            error={
              error === t('onboarding:worker.invalidCoords') ? error : undefined
            }
          />
        </View>
      ) : null}
      {step === 2 ? (
        <View className="mt-6 gap-3">
          <Text className="font-sans text-base text-text-medium">
            {t('onboarding:worker.availabilityHint')}
          </Text>
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6">
        <Button
          disabled={submitting}
          label={
            step < 2 ? t('common:continue') : t('onboarding:worker.finish')
          }
          onPress={() => void onNext()}
        />
      </View>
    </ModulePage>
  );
}
