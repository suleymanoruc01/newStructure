import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import {
  patchWorkerProfile,
  putWorkerAvailability,
} from '../../../api/workers-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
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

export function WorkerOnboardingProfileScreen(_props: Props) {
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
      await completeOnboarding();
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
    <Screen scroll testID={ONBOARDING_SCREEN_IDS.workerProfile}>
      <Text className="text-2xl font-bold text-text-high">
        {t('onboarding:worker.title')}
      </Text>
      <Text className="mt-2 text-base text-text-medium">
        {t('onboarding:worker.step', { current: step + 1, total: 3 })}
      </Text>
      {step === 0 ? (
        <Text className="mt-1 text-sm text-text-low">
          {t('onboarding:worker.timeBudget')}
        </Text>
      ) : null}
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
            variant="ghost"
          />
          <TextField
            label={t('onboarding:worker.latitude')}
            value={homeLat}
            onChangeText={setHomeLat}
            keyboardType="decimal-pad"
          />
          <TextField
            label={t('onboarding:worker.longitude')}
            value={homeLng}
            onChangeText={setHomeLng}
            keyboardType="decimal-pad"
          />
        </View>
      ) : null}
      {step === 2 ? (
        <View className="mt-6 gap-3">
          <Text className="text-base text-text-medium">
            {t('onboarding:worker.availabilityHint')}
          </Text>
        </View>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6 gap-3">
        {step > 0 ? (
          <Button
            label={t('common:back')}
            variant="ghost"
            onPress={() => setStep(step - 1)}
          />
        ) : null}
        <Button
          disabled={submitting}
          label={
            step < 2 ? t('common:continue') : t('onboarding:worker.finish')
          }
          onPress={() => void onNext()}
        />
      </View>
    </Screen>
  );
}
