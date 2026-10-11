import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import {
  fetchWorkerProfile,
  patchWorkerProfile,
} from '../../../api/workers-api';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

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
  const [sectorCodes, setSectorCodes] = useState('');
  const [occupationCodes, setOccupationCodes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const profile = await fetchWorkerProfile(token);
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
      setSectorCodes(profile.sectorCodes.join(', '));
      setOccupationCodes(profile.occupationCodes.join(', '));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

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
      const sectors = sectorCodes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const occupations = occupationCodes
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
          birthDate: birthDate || undefined,
          gender,
          homeLatitude: lat,
          homeLongitude: lng,
          nightShiftAvailable: nightShift,
          sectorCodes: sectors.length > 0 ? sectors : undefined,
          occupationCodes: occupations.length > 0 ? occupations : undefined,
        },
        token,
      );
      navigation.navigate('WorkerProfileRoot');
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
    <Screen scroll testID="m.worker.profile.edit">
      <Text className="text-2xl font-bold text-text-high">
        {t('worker:profile.editTitle')}
      </Text>
      <Text className="mt-2 text-base text-text-medium">
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
        <TextField
          label={t('worker:profile.birthDate')}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
        />
        <TextField
          label={t('worker:profile.homeLat')}
          value={homeLat}
          onChangeText={setHomeLat}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('worker:profile.homeLng')}
          value={homeLng}
          onChangeText={setHomeLng}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('worker:profile.sectors')}
          value={sectorCodes}
          onChangeText={setSectorCodes}
        />
        <TextField
          label={t('worker:profile.occupations')}
          value={occupationCodes}
          onChangeText={setOccupationCodes}
        />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: nightShift }}
          className="flex-row items-center justify-between rounded-2xl bg-surface-1 px-4 py-3"
          onPress={() => setNightShift(!nightShift)}
        >
          <Text className="text-base text-text-high">
            {t('worker:profile.nightShift')}
          </Text>
          <Text className="text-sm font-semibold text-brand-primary">
            {nightShift ? t('common:yes') : t('common:no')}
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap gap-2">
          {(['female', 'male', 'other', 'unspecified'] as const).map((g) => (
            <Pressable
              key={g}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === g }}
              className={`rounded-full px-3 py-2 ${
                gender === g ? 'bg-brand-primary' : 'bg-surface-1'
              }`}
              onPress={() => setGender(g)}
            >
              <Text
                className={
                  gender === g ? 'text-text-on-color' : 'text-text-high'
                }
              >
                {t(`worker:profile.gender.${g}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="mt-8">
        <Button
          label={submitting ? t('common:loading') : t('worker:profile.save')}
          onPress={() => void onSave()}
          disabled={submitting}
        />
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </Screen>
  );
}
