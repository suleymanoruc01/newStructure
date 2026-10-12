import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ClayChip } from '../../../components/ui/ClayChip';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { fetchJobCatalog } from '../../../api/jobs-api';
import {
  fetchWorkerProfile,
  patchWorkerProfile,
} from '../../../api/workers-api';
import { AccountLinkSection } from '../../shared/AccountLinkSection';
import { LocationMap } from '../../../components/map/LocationMap';
import { BirthDateChips } from '../../../components/ui/BirthDateChips';
import { clayCard } from '../../../components/ui/clay';
import { WizardShell } from '../../../components/ui/WizardShell';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type CatalogSector = Awaited<ReturnType<typeof fetchJobCatalog>>['sectors'][number];

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerProfileEdit'>;

export function WorkerProfileEditScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<
    'female' | 'male' | 'other' | 'unspecified'
  >('unspecified');
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');
  const [nightShift, setNightShift] = useState(false);
  const [sectorCodes, setSectorCodes] = useState<string[]>([]);
  const [occupationCodes, setOccupationCodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<CatalogSector[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sectorQuery, setSectorQuery] = useState('');
  const [occupationQuery, setOccupationQuery] = useState('');
  const [step, setStep] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [profile, catalog] = await Promise.all([
        fetchWorkerProfile(token),
        fetchJobCatalog(),
      ]);
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setBirthDate(profile.birthDate ?? '');
      setGender(profile.gender ?? 'unspecified');
      setHomeLat(
        profile.homeLatitude != null ? String(profile.homeLatitude) : '',
      );
      setHomeLng(
        profile.homeLongitude != null ? String(profile.homeLongitude) : '',
      );
      setNightShift(profile.nightShiftAvailable);
      setSectorCodes(profile.sectorCodes);
      setOccupationCodes(profile.occupationCodes);
      setSectors(catalog.sectors);
    } catch (err) {
      setError(formErrorMessage(err, t));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const sectorNeedle = sectorQuery.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = sectorNeedle
    ? sectors.filter((sector) =>
        sector.displayName.toLocaleLowerCase('tr-TR').includes(sectorNeedle),
      )
    : sectors;
  const occupations = sectors
    .filter((sector) => sectorCodes.includes(sector.code))
    .flatMap((sector) => sector.occupations);
  const occupationNeedle = occupationQuery.trim().toLocaleLowerCase('tr-TR');
  const shownOccupations = occupationNeedle
    ? occupations.filter((occupation) =>
        occupation.title.toLocaleLowerCase('tr-TR').includes(occupationNeedle),
      )
    : occupations;

  const onSave = async () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !birthDate) {
        setError(t('worker:profile.identityIncomplete'));
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
        setError(t('worker:profile.invalidCoords'));
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
          t('worker:profile.invalidCoords'),
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
          birthDate: birthDate || undefined,
          gender,
          homeLatitude: lat,
          homeLongitude: lng,
          nightShiftAvailable: nightShift,
          sectorCodes: sectorCodes.length > 0 ? sectorCodes : undefined,
          occupationCodes:
            occupationCodes.length > 0 ? occupationCodes : undefined,
        },
        token,
      );
      navigation.navigate('WorkerProfileRoot');
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
      testID="m.worker.profile.edit"
      title={t('worker:profile.editTitle')}
    >
      <WizardShell
        error={error}
        heading={
          step === 0
            ? t('worker:profile.wizard.identity')
            : step === 1
              ? t('worker:profile.wizard.location')
              : t('worker:profile.wizard.work')
        }
        hint={
          step === 0
            ? t('worker:profile.wizard.identityHint')
            : step === 1
              ? t('worker:profile.wizard.locationHint')
              : t('worker:profile.wizard.workHint')
        }
        primaryDisabled={submitting}
        primaryLabel={
          step < 2
            ? t('common:continue')
            : submitting
              ? t('common:loading')
              : t('worker:profile.save')
        }
        step={step + 1}
        total={3}
        onPrimary={() => void onSave()}
      >
        {step === 0 ? (
          <View className="gap-3">
            <TextField
              autoCapitalize="words"
              label={t('worker:profile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextField
              autoCapitalize="words"
              label={t('worker:profile.lastName')}
              value={lastName}
              onChangeText={setLastName}
            />
            <BirthDateChips value={birthDate} onChange={setBirthDate} />
            <View className="flex-row flex-wrap gap-2">
              {(['female', 'male', 'other', 'unspecified'] as const).map((g) => (
                <ClayChip
                  key={g}
                  accessibilityRole="radio"
                  label={t(`worker:profile.gender.${g}`)}
                  selected={gender === g}
                  tone="accent"
                  onPress={() => setGender(g)}
                />
              ))}
            </View>
          </View>
        ) : null}
        {step === 1 ? (
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
        ) : null}
        {step === 2 ? (
          <View className="gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('worker:profile.sectors')}
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
              {shownSectors.map((sector) => {
                const on = sectorCodes.includes(sector.code);
                return (
                  <ClayChip
                    key={sector.code}
                    label={sector.displayName}
                    selected={on}
                    onPress={() => {
                      setSectorCodes((current) =>
                        current.includes(sector.code)
                          ? current.filter((code) => code !== sector.code)
                          : [...current, sector.code],
                      );
                      if (on) {
                        const occupationSet = new Set(
                          sector.occupations.map((row) => row.code),
                        );
                        setOccupationCodes((current) =>
                          current.filter((code) => !occupationSet.has(code)),
                        );
                      }
                    }}
                  />
                );
              })}
              {sectors.length > 0 && shownSectors.length === 0 ? (
                <Text className="font-sans text-sm text-text-medium">
                  {t('worker:profile.sectorSearchEmpty')}
                </Text>
              ) : null}
            </View>
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('worker:profile.occupations')}
            </Text>
            {occupations.length > 6 ? (
              <TextField
                inset
                shape="capsule"
                label={t('worker:profile.occupationSearch')}
                onChangeText={setOccupationQuery}
                value={occupationQuery}
              />
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {shownOccupations.map((occupation) => (
                <ClayChip
                  key={occupation.code}
                  label={occupation.title}
                  selected={occupationCodes.includes(occupation.code)}
                  tone="accent"
                  onPress={() =>
                    setOccupationCodes((current) =>
                      current.includes(occupation.code)
                        ? current.filter((code) => code !== occupation.code)
                        : [...current, occupation.code],
                    )
                  }
                />
              ))}
              {occupations.length > 0 && shownOccupations.length === 0 ? (
                <Text className="font-sans text-sm text-text-medium">
                  {t('worker:profile.occupationSearchEmpty')}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: nightShift }}
              className="flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3"
              style={clayCard}
              onPress={() => setNightShift(!nightShift)}
            >
              <Text className="font-sans text-base text-text-high">
                {t('worker:profile.nightShift')}
              </Text>
              <StatusBadge
                label={nightShift ? t('common:yes') : t('common:no')}
                tone={nightShift ? 'strong' : 'neutral'}
              />
            </Pressable>
            <AccountLinkSection />
          </View>
        ) : null}
      </WizardShell>
    </ModulePage>
  );
}
