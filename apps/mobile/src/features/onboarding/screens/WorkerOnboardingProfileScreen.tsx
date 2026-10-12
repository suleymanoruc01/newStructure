import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { LocationMap } from '../../../components/map/LocationMap';
import { AvailabilityWeekGrid } from '../../../components/availability/AvailabilityWeekGrid';
import { BirthDateChips } from '../../../components/ui/BirthDateChips';
import { ClayChip } from '../../../components/ui/ClayChip';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { WizardShell } from '../../../components/ui/WizardShell';
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
      .then((catalog) => setSectors(catalog.sectors ?? []))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const onNext = async () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !birthDate) {
        setError(t('onboarding:worker.identityIncomplete'));
        return;
      }
      setError(null);
      setStep(1);
      return;
    }
    if (step === 1) {
      const lat = Number.parseFloat(homeLat);
      const lng = Number.parseFloat(homeLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError(t('onboarding:worker.invalidCoords'));
        return;
      }
      setError(null);
      setStep(2);
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
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('onboarding:worker.wizard.identity')
            : step === 1
              ? t('onboarding:worker.wizard.work')
              : t('onboarding:worker.wizard.availability')
        }
        hint={
          step === 0
            ? t('onboarding:worker.wizard.identityHint')
            : step === 1
              ? t('onboarding:worker.wizard.workHint')
              : t('onboarding:worker.wizard.availabilityHint')
        }
        primaryDisabled={submitting}
        primaryLabel={
          step < 2 ? t('common:continue') : t('onboarding:worker.finish')
        }
        step={step + 1}
        total={3}
        onPrimary={() => void onNext()}
      >
      {step === 0 ? (
        <View className="gap-3">
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
              <ClayChip
                key={value}
                accessibilityRole="radio"
                label={t(`worker:profile.gender.${value}`)}
                selected={gender === value}
                onPress={() => setGender(value)}
              />
            ))}
          </View>
        </View>
      ) : null}
      {step === 1 ? (
        <View className="gap-3">
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
                return (sector.displayName ?? '')
                  .toLocaleLowerCase('tr-TR')
                  .includes(needle);
              })
              .map((sector) => (
                <ClayChip
                  key={sector.code}
                  label={sector.displayName}
                  selected={sectorCodes.includes(sector.code)}
                  onPress={() =>
                    setSectorCodes((current) =>
                      current.includes(sector.code)
                        ? current.filter((code) => code !== sector.code)
                        : [...current, sector.code],
                    )
                  }
                />
              ))}
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
        <View className="gap-3">
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
                <ClayChip
                  key={`s-${hour}`}
                  label={t('worker:availability.hour', { hour })}
                  selected={availStart === value}
                  onPress={() => setAvailStart(value)}
                />
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
                <ClayChip
                  key={`e-${hour}`}
                  label={t('worker:availability.hour', { hour })}
                  selected={availEnd === value}
                  onPress={() => setAvailEnd(value)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
      </WizardShell>
    </ModulePage>
  );
}
