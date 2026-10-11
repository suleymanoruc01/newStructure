import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { listBranches } from '../../../api/branches-api';
import { fetchEmployerMe } from '../../../api/employers-api';
import { createBranchJob } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useAuth } from '../../../shared/auth/AuthProvider';

function parseOptionalAge(raw: string, message: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new ApiClientError(message, 400, 'VALIDATION_FAILED');
  }
  const value = Number.parseInt(trimmed, 10);
  if (value > 120) {
    throw new ApiClientError(message, 400, 'VALIDATION_FAILED');
  }
  return value;
}

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerCreateJob'>;

export function EmployerCreateJobScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const { contexts } = useAuth();
  const [branchId, setBranchId] = useState('');
  const [sectorCode, setSectorCode] = useState('hospitality');
  const [occupationCode, setOccupationCode] = useState('waiter');
  const [headcount, setHeadcount] = useState('1');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'none' | 'female' | 'male'>(
    'none',
  );
  const [requiredDocumentTypes, setRequiredDocumentTypes] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const employerCtx = contexts.find((c) => c.role === 'employer');
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
    setStartsAt(start.toISOString());
    setEndsAt(end.toISOString());
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      try {
        const [branches, employer] = await Promise.all([
          listBranches(token),
          fetchEmployerMe(token),
        ]);
        const first = branches.items[0]?.id;
        if (first) {
          setBranchId(first);
        }
        setVerificationStatus(employer.verificationStatus);
      } catch {
        setBranchId('');
      }
    })();
  }, [contexts]);

  const canPublish =
    verificationStatus === 'verified' || verificationStatus === 'bypass';

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (!branchId) {
        throw new ApiClientError(
          t('employer:jobs.branchRequired'),
          400,
          'VALIDATION_FAILED',
        );
      }
      if (!canPublish) {
        throw new ApiClientError(
          t('employer:verification.publishBlocked'),
          422,
          'EMPLOYER_UNVERIFIED',
        );
      }
      const parsedMinAge = parseOptionalAge(minAge, t('employer:jobs.ageInvalid'));
      const parsedMaxAge = parseOptionalAge(maxAge, t('employer:jobs.ageInvalid'));
      if (
        parsedMinAge !== undefined &&
        parsedMaxAge !== undefined &&
        parsedMinAge > parsedMaxAge
      ) {
        throw new ApiClientError(
          t('employer:jobs.ageRangeInvalid'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const docTypes = requiredDocumentTypes
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      await createBranchJob(
        branchId,
        {
          sectorCode,
          occupationCode,
          headcount: Number.parseInt(headcount, 10),
          startsAt,
          endsAt,
          publish: true,
          favoritesOnly,
          genderFilter:
            genderFilter === 'none' ? undefined : genderFilter,
          minAge: parsedMinAge,
          maxAge: parsedMaxAge,
          requiredDocumentTypes:
            docTypes.length > 0 ? docTypes : undefined,
        },
        token,
      );
      navigation.navigate('EmployerJobsList');
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage title={t('employer:jobs.createTitle')} testID="m.employer.jobs.create.step1" scroll>
      
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {!canPublish && verificationStatus ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">
          {t('employer:verification.publishBlocked')}
        </Text>
      ) : null}
      <View className="mt-6 gap-3">
        <TextField
          label={t('employer:jobs.branchId')}
          value={branchId}
          onChangeText={setBranchId}
          error={error === t('employer:jobs.branchRequired') ? error : undefined}
        />
        <TextField
          label={t('employer:jobs.sector')}
          value={sectorCode}
          onChangeText={setSectorCode}
        />
        <TextField
          label={t('employer:jobs.occupation')}
          value={occupationCode}
          onChangeText={setOccupationCode}
        />
        <TextField
          label={t('employer:jobs.headcount')}
          value={headcount}
          onChangeText={setHeadcount}
          keyboardType="number-pad"
        />
        <TextField
          label={t('employer:jobs.startsAt')}
          value={startsAt}
          onChangeText={setStartsAt}
        />
        <TextField
          label={t('employer:jobs.endsAt')}
          value={endsAt}
          onChangeText={setEndsAt}
        />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: favoritesOnly }}
          className="flex-row items-center justify-between rounded-xl bg-surface-1 px-4 py-3"
          onPress={() => setFavoritesOnly((v) => !v)}
        >
          <Text className="font-sans text-base text-text-high">
            {t('employer:jobs.favoritesOnly')}
          </Text>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {favoritesOnly ? t('common:yes') : t('common:no')}
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap gap-2">
          {(['none', 'female', 'male'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              className={`rounded-full px-3 py-2 ${
                genderFilter === value ? 'bg-accent-mustard' : 'bg-surface-1'
              }`}
              onPress={() => setGenderFilter(value)}
            >
              <Text className="font-sans text-sm text-text-high">
                {t(`employer:jobs.genderFilter.${value}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField
          label={t('employer:jobs.minAge')}
          value={minAge}
          onChangeText={setMinAge}
          keyboardType="number-pad"
          error={
            error === t('employer:jobs.ageInvalid') ||
            error === t('employer:jobs.ageRangeInvalid')
              ? error
              : undefined
          }
        />
        <TextField
          label={t('employer:jobs.maxAge')}
          value={maxAge}
          onChangeText={setMaxAge}
          keyboardType="number-pad"
          error={
            error === t('employer:jobs.ageInvalid') ||
            error === t('employer:jobs.ageRangeInvalid')
              ? error
              : undefined
          }
        />
        <TextField
          label={t('employer:jobs.requiredDocuments')}
          value={requiredDocumentTypes}
          onChangeText={setRequiredDocumentTypes}
        />
      </View>
      <View className="mt-6">
        <Button
          disabled={submitting || !canPublish}
          label={t('employer:jobs.publish')}
          onPress={() => void onSubmit()}
        />
      </View>
    </ModulePage>
  );
}
