import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { LocationMap } from '../../../components/map/LocationMap';
import { AvailabilityWeekGrid } from '../../../components/availability/AvailabilityWeekGrid';
import { BirthDateChips } from '../../../components/ui/BirthDateChips';
import { Button } from '../../../components/ui/Button';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardSteps } from '../../../components/ui/WizardSteps';
import { clayCard } from '../../../components/ui/clay';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import {
  patchWorkerProfile,
  putWorkerAvailability,
} from '../../../api/workers-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { continueAfterGate } from '../../../shared/auth/auth-gate';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  AVAIL_HOURS,
  parseTimeToMinute,
} from '../../../shared/availability/time-minutes';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WorkerOnboardingProfile'
>;

const GENDERS = ['female', 'male', 'other', 'unspecified'] as const;

export function WorkerOnboardingProfileScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'worker', 'common', 'errors']);
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('unspecified');
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');
  const [nightShift, setNightShift] = useState(false);
  const [sectorCodes, setSectorCodes] = useState<string[]>([]);
  const [availDays, setAvailDays] = useState<number[]>([]);
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('17:00');
  const [availDay, setAvailDay] = useState(1);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [sectorQuery, setSectorQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchJobCatalog()
      .then((catalog) => setSectors(catalog.sectors))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

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
          sectorCodes: sectorCodes.length > 0 ? sectorCodes : undefined,
        },
        token,
      );
      if (availDays.length === 0) {
        throw new ApiClientError(
          t('worker:availability.empty'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const startMinute = parseTimeToMinute(availStart);
      const endMinute = parseTimeToMinute(availEnd);
      await putWorkerAvailability(
        {
          windows: availDays.map((dayOfWeek) => ({
            dayOfWeek,
            startMinute,
            endMinute,
            crossesMidnight: endMinute <= startMinute,
          })),
        },
        token,
      );
      continueAfterGate(navigation, await completeOnboarding());
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const lat = Number.parseFloat(homeLat);
  const lng = Number.parseFloat(homeLng);

  return (
    <ModulePage
      back={step > 0 ? () => setStep(step - 1) : 'auto'}
      scroll
      testID={ONBOARDING_SCREEN_IDS.workerProfile}
      title={t('onboarding:worker.title')}
    >
      <WizardSteps step={step + 1} total={3} />
      {step === 0 ? (
        <View className="mt-2 gap-3">
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
          <BirthDateChips value={birthDate} onChange={setBirthDate} />
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('onboarding:worker.gender')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GENDERS.map((value) => (
              <Pressable
                key={value}
                className={`rounded-full px-3 py-2 ${
                  gender === value ? 'bg-action-primary' : 'bg-surface-1'
                }`}
                onPress={() => setGender(value)}
              >
                <Text
                  className={`font-sans text-sm ${
                    gender === value ? 'text-text-on' : 'text-text-high'
                  }`}
                >
                  {t(`worker:profile.gender.${value}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {step === 1 ? (
        <View className="mt-2 gap-3">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('onboarding:worker.sectors')}
          </Text>
          {sectors.length > 0 ? (
            <TextField
              inset
              shape="capsule"
              label={t('worker:profile.sectorSearch')}
              onChangeText={setSectorQuery}
              value={sectorQuery}
            />
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {sectors
              .filter((sector) => {
                const needle = sectorQuery.trim().toLocaleLowerCase('tr-TR');
                if (!needle) {
                  return true;
                }
                return sector.displayName
                  .toLocaleLowerCase('tr-TR')
                  .includes(needle);
              })
              .map((sector) => {
              const on = sectorCodes.includes(sector.code);
              return (
                <Pressable
                  key={sector.code}
                  className={`rounded-full px-3 py-2 ${
                    on ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  onPress={() =>
                    setSectorCodes((current) =>
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
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: nightShift }}
            className="flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3"
            style={clayCard}
            onPress={() => setNightShift(!nightShift)}
          >
            <Text className="font-sans text-base text-text-high">
              {nightShift
                ? t('onboarding:worker.nightShiftOn')
                : t('onboarding:worker.nightShiftOff')}
            </Text>
            <StatusBadge
              label={nightShift ? t('common:yes') : t('common:no')}
              tone={nightShift ? 'strong' : 'neutral'}
            />
          </Pressable>
          <LocationMap
            pin={
              Number.isFinite(lat) && Number.isFinite(lng)
                ? { latitude: lat, longitude: lng }
                : null
            }
            locateMoment="pin-pick"
            onPick={(pin) => {
              setHomeLat(String(pin.latitude));
              setHomeLng(String(pin.longitude));
            }}
          />
        </View>
      ) : null}
      {step === 2 ? (
        <View className="mt-2 gap-3">
          <Text className="font-sans text-base text-text-medium">
            {t('onboarding:worker.availabilityHint')}
          </Text>
          <AvailabilityWeekGrid
            markedDays={availDays}
            selectedDay={availDay}
            onSelect={(day) => {
              setAvailDay(day);
              setAvailDays((current) =>
                current.includes(day)
                  ? current.filter((item) => item !== day)
                  : [...current, day],
              );
            }}
          />
          <Text className="font-sans text-sm text-text-medium">
            {t('worker:availability.startTime')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {AVAIL_HOURS.map((hour) => {
              const value = `${String(hour).padStart(2, '0')}:00`;
              return (
                <Pressable
                  key={`s-${hour}`}
                  className={`rounded-full px-3 py-2 ${
                    availStart === value ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  onPress={() => setAvailStart(value)}
                >
                  <Text
                    className={`font-sans text-sm ${
                      availStart === value ? 'text-text-on' : 'text-text-high'
                    }`}
                  >
                    {t('worker:availability.hour', { hour })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="font-sans text-sm text-text-medium">
            {t('worker:availability.endTime')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {AVAIL_HOURS.map((hour) => {
              const value = `${String(hour).padStart(2, '0')}:00`;
              return (
                <Pressable
                  key={`e-${hour}`}
                  className={`rounded-full px-3 py-2 ${
                    availEnd === value ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  onPress={() => setAvailEnd(value)}
                >
                  <Text
                    className={`font-sans text-sm ${
                      availEnd === value ? 'text-text-on' : 'text-text-high'
                    }`}
                  >
                    {t('worker:availability.hour', { hour })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
