import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
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
import { Button } from '../../../components/ui/Button';
import { clayCard } from '../../../components/ui/clay';
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

  return (
    <ModulePage title={t('worker:profile.editTitle')} testID="m.worker.profile.edit" scroll>
      
      <Text className="font-sans mt-2 text-base text-text-medium">
        {t('worker:profile.editLead')}
      </Text>
      <View className="mt-6 gap-3">
        <TextField
          label={t('worker:profile.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextField
          label={t('worker:profile.lastName')}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
        <BirthDateChips value={birthDate} onChange={setBirthDate} />
        <LocationMap
          pin={
            Number.isFinite(Number.parseFloat(homeLat)) &&
            Number.isFinite(Number.parseFloat(homeLng))
              ? {
                  latitude: Number.parseFloat(homeLat),
                  longitude: Number.parseFloat(homeLng),
                }
              : null
          }
          locateMoment="pin-pick"
          onPick={(pin) => {
            setHomeLat(String(pin.latitude));
            setHomeLng(String(pin.longitude));
          }}
        />
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
              <Pressable
                key={sector.code}
                className={`rounded-full px-3 py-2 ${
                  on ? 'bg-action-primary' : 'bg-surface-1'
                }`}
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
          {shownOccupations.map((occupation) => {
              const on = occupationCodes.includes(occupation.code);
              return (
                <Pressable
                  key={occupation.code}
                  className={`rounded-full px-3 py-2 ${
                    on ? 'bg-accent-mustard' : 'bg-surface-1'
                  }`}
                  onPress={() =>
                    setOccupationCodes((current) =>
                      current.includes(occupation.code)
                        ? current.filter((code) => code !== occupation.code)
                        : [...current, occupation.code],
                    )
                  }
                >
                  <Text className="font-sans text-sm text-text-high">
                    {occupation.title}
                  </Text>
                </Pressable>
              );
            })}
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
        <View className="flex-row flex-wrap gap-2">
          {(['female', 'male', 'other', 'unspecified'] as const).map((g) => (
            <Pressable
              key={g}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === g }}
              className={`rounded-full px-3 py-2 ${
                gender === g ? 'bg-accent-mustard' : 'bg-surface-1'
              }`}
              onPress={() => setGender(g)}
            >
              <Text className="font-sans text-text-high">
                {t(`worker:profile.gender.${g}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <AccountLinkSection />
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <Button
          label={submitting ? t('common:loading') : t('worker:profile.save')}
          onPress={() => void onSave()}
          disabled={submitting}
        />
      </View>
    </ModulePage>
  );
}
