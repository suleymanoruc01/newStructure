import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ClayChip } from '../../../components/ui/ClayChip';
import { clayCard, clayChip } from '../../../components/ui/clay';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { TokenCostPreview } from '../../../components/tokens/TokenCostPreview';
import { Button } from '../../../components/ui/Button';
import { WizardShell } from '../../../components/ui/WizardShell';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { listBranches } from '../../../api/branches-api';
import { fetchEmployerMe } from '../../../api/employers-api';
import { createBranchJob, fetchJobCatalog } from '../../../api/jobs-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { formatPayTry, tryMajorToMinor } from '../../../shared/format/pay';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';
import {
  SHIFT_DURATIONS_H,
  SHIFT_START_HOURS,
  dayChipLabel,
  nextIstanbulDayKeys,
  wallToIso,
} from '../../../shared/datetime/shift-when';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';

const AMENITIES = ['meal', 'transport', 'parking', 'lodging'] as const;
const DOC_TYPES = [
  'id_card',
  'criminal_record',
  'health_report',
  'food_hygiene',
  'drivers_license',
  'other',
] as const;

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

type CatalogSector = Awaited<ReturnType<typeof fetchJobCatalog>>['sectors'][number];
type BranchItem = Awaited<ReturnType<typeof listBranches>>['items'][number];

export function EmployerCreateJobScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'worker', 'common', 'errors']);
  const { contexts } = useAuth();
  const timeZone = useDisplayTimeZone();
  const days = nextIstanbulDayKeys(7, new Date(), timeZone);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [sectors, setSectors] = useState<CatalogSector[]>([]);
  const [branchId, setBranchId] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [occupationCode, setOccupationCode] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [payTry, setPayTry] = useState('');
  const [tokenAvailable, setTokenAvailable] = useState<number | null>(null);
  const [dayKey, setDayKey] = useState(() => nextIstanbulDayKeys(2)[1] ?? nextIstanbulDayKeys(1)[0]!);
  const [startHour, setStartHour] = useState<(typeof SHIFT_START_HOURS)[number]>(9);
  const [durationH, setDurationH] = useState<(typeof SHIFT_DURATIONS_H)[number]>(8);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [instantAutoApprove, setInstantAutoApprove] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<'none' | 'female' | 'male'>(
    'none',
  );
  const [requiredDocumentTypes, setRequiredDocumentTypes] = useState<string[]>(
    [],
  );
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null,
  );
  const [notes, setNotes] = useState('');
  const [sectorQuery, setSectorQuery] = useState('');
  const [occupationQuery, setOccupationQuery] = useState('');
  const [branchQuery, setBranchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      try {
        const [branchList, employer, catalog] = await Promise.all([
          listBranches(token),
          fetchEmployerMe(token),
          fetchJobCatalog(),
        ]);
        setBranches(branchList.items);
        if (branchList.items.length === 1) {
          setBranchId(branchList.items[0]!.id);
        }
        setSectors(catalog.sectors);
        if (catalog.sectors.length === 1) {
          const only = catalog.sectors[0]!;
          setSectorCode(only.code);
          if (only.occupations.length === 1) {
            setOccupationCode(only.occupations[0]!.code);
          }
        }
        setVerificationStatus(employer.verificationStatus);
        try {
          const tokens = await fetchTokenBalance(token);
          setTokenAvailable(tokens.available);
        } catch {
          setTokenAvailable(null);
        }
      } catch (err) {
        setError(formErrorMessage(err, t));
      }
    })();
  }, [contexts, t]);

  const occupations =
    sectors.find((sector) => sector.code === sectorCode)?.occupations ?? [];
  const sectorNeedle = sectorQuery.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = sectorNeedle
    ? sectors.filter((sector) =>
        sector.displayName.toLocaleLowerCase('tr-TR').includes(sectorNeedle),
      )
    : sectors;
  const occupationNeedle = occupationQuery.trim().toLocaleLowerCase('tr-TR');
  const shownOccupations = occupationNeedle
    ? occupations.filter((row) =>
        row.title.toLocaleLowerCase('tr-TR').includes(occupationNeedle),
      )
    : occupations;
  const branchNeedle = branchQuery.trim().toLocaleLowerCase('tr-TR');
  const shownBranches = branchNeedle
    ? branches.filter((branch) =>
        branch.name.toLocaleLowerCase('tr-TR').includes(branchNeedle),
      )
    : branches;
  const canPublish =
    verificationStatus === 'verified' || verificationStatus === 'bypass';
  const testID =
    step === 1
      ? 'm.employer.jobs.create.step1'
      : step === 4
        ? 'm.employer.jobs.create.step3'
        : 'm.employer.jobs.create.step2';

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!branchId) {
        setError(t('employer:jobs.branchRequired'));
        return;
      }
      if (!sectorCode) {
        setError(t('employer:jobs.sectorRequired'));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  };

  const submit = async (publish: boolean) => {
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
      if (!sectorCode) {
        throw new ApiClientError(
          t('employer:jobs.sectorRequired'),
          400,
          'VALIDATION_FAILED',
        );
      }
      if (publish && !canPublish) {
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
      const docTypes = requiredDocumentTypes;
      const payAmountMinor = tryMajorToMinor(payTry);
      if (payTry.trim() && payAmountMinor == null) {
        throw new ApiClientError(
          t('employer:jobs.payInvalid'),
          400,
          'VALIDATION_FAILED',
        );
      }
      const { startsAt, endsAt } = wallToIso(
        dayKey,
        startHour,
        durationH,
        timeZone,
      );
      await createBranchJob(
        branchId,
        {
          sectorCode,
          occupationCode: occupationCode || undefined,
          headcount: Number.parseInt(headcount, 10),
          startsAt,
          endsAt,
          publish,
          favoritesOnly,
          instantAutoApprove,
          amenities: amenities.length > 0 ? amenities : undefined,
          genderFilter: genderFilter === 'none' ? undefined : genderFilter,
          minAge: parsedMinAge,
          maxAge: parsedMaxAge,
          requiredDocumentTypes: docTypes.length > 0 ? docTypes : undefined,
          payAmountMinor,
          notes: notes.trim() || undefined,
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

  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const branchName = selectedBranch?.name;
  const sectorName = sectors.find((sector) => sector.code === sectorCode)?.displayName;
  const occupationName = occupations.find((row) => row.code === occupationCode)?.title;
  const when = wallToIso(dayKey, startHour, durationH, timeZone);
  const payAmountMinor = tryMajorToMinor(payTry);

  const wizardCopy =
    step === 1
      ? {
          heading: t('employer:jobs.wizard.place'),
          hint: t('employer:jobs.wizard.placeHint'),
        }
      : step === 2
        ? {
            heading: t('employer:jobs.wizard.when'),
            hint: t('employer:jobs.wizard.whenHint'),
          }
        : step === 3
          ? {
              heading: t('employer:jobs.wizard.audience'),
              hint: t('employer:jobs.wizard.audienceHint'),
            }
          : {
              heading: t('employer:jobs.wizard.review'),
              hint: t('employer:jobs.wizard.reviewHint'),
            };

  return (
    <ModulePage
      back={step > 1 ? () => setStep((current) => (current - 1) as 1 | 2 | 3 | 4) : 'auto'}
      scroll
      testID={testID}
      title={t('employer:jobs.createTitle')}
    >
      <WizardShell
        error={
          error ??
          (!canPublish && verificationStatus
            ? t('employer:verification.publishBlocked')
            : null)
        }
        extraFooter={
          step === 4 ? (
            <Button
              disabled={submitting}
              label={t('employer:jobs.saveDraft')}
              variant="secondary"
              onPress={() => void submit(false)}
            />
          ) : null
        }
        heading={wizardCopy.heading}
        hint={wizardCopy.hint}
        primaryDisabled={step === 4 && (submitting || !canPublish)}
        primaryLabel={
          step === 4 ? t('employer:jobs.publish') : t('common:continue')
        }
        step={step}
        total={4}
        onPrimary={() => {
          if (step < 4) {
            goNext();
            return;
          }
          void submit(true);
        }}
      >
      {step === 1 ? (
        <View className="gap-3">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.branchId')}
          </Text>
          {branches.length > 4 ? (
            <TextField
              inset
              shape="capsule"
              label={t('employer:jobs.branchSearch')}
              onChangeText={setBranchQuery}
              value={branchQuery}
            />
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {shownBranches.map((branch) => (
              <ClayChip
                key={branch.id}
                label={branch.name}
                selected={branchId === branch.id}
                onPress={() => setBranchId(branch.id)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.sector')}
          </Text>
          {sectors.length > 6 ? (
            <TextField
              inset
              shape="capsule"
              label={t('employer:jobs.sectorSearch')}
              onChangeText={setSectorQuery}
              value={sectorQuery}
            />
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {shownSectors.map((sector) => (
              <ClayChip
                key={sector.code}
                label={sector.displayName}
                selected={sectorCode === sector.code}
                onPress={() => {
                  setSectorCode(sector.code);
                  setOccupationCode(sector.occupations[0]?.code ?? '');
                }}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.occupation')}
          </Text>
          {occupations.length > 6 ? (
            <TextField
              inset
              shape="capsule"
              label={t('employer:jobs.occupationSearch')}
              onChangeText={setOccupationQuery}
              value={occupationQuery}
            />
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {shownOccupations.map((occupation) => (
              <ClayChip
                key={occupation.code}
                label={occupation.title}
                selected={occupationCode === occupation.code}
                onPress={() => setOccupationCode(occupation.code)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.headcount')}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-1"
              style={clayChip(false)}
              onPress={() =>
                setHeadcount(String(Math.max(1, (Number.parseInt(headcount, 10) || 1) - 1)))
              }
            >
              <Text className="font-sans text-lg text-text-high">−</Text>
            </Pressable>
            <Text className="font-display text-xl font-semibold text-text-high">
              {Number.parseInt(headcount, 10) || 1}
            </Text>
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-1"
              style={clayChip(false)}
              onPress={() =>
                setHeadcount(String((Number.parseInt(headcount, 10) || 1) + 1))
              }
            >
              <Text className="font-sans text-lg text-text-high">+</Text>
            </Pressable>
          </View>
          <TextField
            label={t('employer:jobs.pay')}
            value={payTry}
            onChangeText={setPayTry}
            keyboardType="decimal-pad"
          />
        </View>
      ) : null}
      {step === 2 ? (
        <View className="gap-3">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.whenDay')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {days.map((key) => (
              <ClayChip
                key={key}
                label={dayChipLabel(key, timeZone)}
                selected={dayKey === key}
                onPress={() => setDayKey(key)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.whenStart')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SHIFT_START_HOURS.map((hour) => (
              <ClayChip
                key={hour}
                label={t('employer:jobs.hour', { hour })}
                selected={startHour === hour}
                onPress={() => setStartHour(hour)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.whenHours')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SHIFT_DURATIONS_H.map((hours) => (
              <ClayChip
                key={hours}
                label={t('employer:jobs.hours', { hours })}
                selected={durationH === hours}
                onPress={() => setDurationH(hours)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm text-text-medium">
            {formatIstanbul(when.startsAt, timeZone)} –{' '}
            {formatIstanbul(when.endsAt, timeZone)}
          </Text>
        </View>
      ) : null}
      {step === 3 ? (
        <View className="gap-3">
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: favoritesOnly }}
            style={clayCard}
            className="flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3"
            onPress={() => setFavoritesOnly((v) => !v)}
          >
            <Text className="font-sans text-base text-text-high">
              {t('employer:jobs.favoritesOnly')}
            </Text>
            <StatusBadge
              label={favoritesOnly ? t('common:yes') : t('common:no')}
              tone={favoritesOnly ? 'strong' : 'neutral'}
            />
          </Pressable>
          {favoritesOnly ? (
            <Text className="font-sans text-sm text-text-medium">
              {t('employer:jobs.favoritesOnlyHint')}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: instantAutoApprove }}
            style={clayCard}
            className="flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3"
            onPress={() => setInstantAutoApprove((v) => !v)}
          >
            <Text className="font-sans text-base text-text-high">
              {t('employer:jobs.instantAutoApprove')}
            </Text>
            <StatusBadge
              label={instantAutoApprove ? t('common:yes') : t('common:no')}
              tone={instantAutoApprove ? 'strong' : 'neutral'}
            />
          </Pressable>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.amenities')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {AMENITIES.map((value) => (
              <ClayChip
                key={value}
                label={t(`employer:jobs.amenity.${value}`)}
                selected={amenities.includes(value)}
                tone="accent"
                onPress={() =>
                  setAmenities((current) =>
                    current.includes(value)
                      ? current.filter((item) => item !== value)
                      : [...current, value],
                  )
                }
              />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {(['none', 'female', 'male'] as const).map((value) => (
              <ClayChip
                key={value}
                label={t(`employer:jobs.genderFilter.${value}`)}
                selected={genderFilter === value}
                tone="accent"
                onPress={() => setGenderFilter(value)}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.minAge')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <ClayChip
              label={t('employer:jobs.ageAny')}
              selected={minAge === ''}
              onPress={() => setMinAge('')}
            />
            {([18, 21, 25, 30] as const).map((age) => (
              <ClayChip
                key={`min-${age}`}
                label={String(age)}
                selected={minAge === String(age)}
                onPress={() => setMinAge(String(age))}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.maxAge')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <ClayChip
              label={t('employer:jobs.ageAny')}
              selected={maxAge === ''}
              onPress={() => setMaxAge('')}
            />
            {([35, 45, 55, 65] as const).map((age) => (
              <ClayChip
                key={`max-${age}`}
                label={String(age)}
                selected={maxAge === String(age)}
                onPress={() => setMaxAge(String(age))}
              />
            ))}
          </View>
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.requiredDocuments')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DOC_TYPES.map((type) => (
              <ClayChip
                key={type}
                label={t(`worker:documents.types.${type}`)}
                selected={requiredDocumentTypes.includes(type)}
                tone="accent"
                onPress={() =>
                  setRequiredDocumentTypes((current) =>
                    current.includes(type)
                      ? current.filter((item) => item !== type)
                      : [...current, type],
                  )
                }
              />
            ))}
          </View>
        </View>
      ) : null}
      {step === 4 ? (
        <View className="gap-3">
          <StatStrip
            items={[
              {
                label: t('employer:jobs.headcount'),
                value: String(Number.parseInt(headcount, 10) || 1),
              },
              ...(formatPayTry(payAmountMinor)
                ? [
                    {
                      label: t('employer:jobs.pay'),
                      value: formatPayTry(payAmountMinor)!,
                    },
                  ]
                : []),
              {
                label: t('employer:jobs.genderFilter.none'),
                value: t(`employer:jobs.genderFilter.${genderFilter}`),
              },
            ]}
          />
          <JobCard
            title={
              [branchName, sectorName, occupationName]
                .filter(Boolean)
                .join(' · ') || t('employer:jobs.createTitle')
            }
          >
            <JobFacts
              branchName={branchName}
              startsAt={when.startsAt}
              endsAt={when.endsAt}
              payAmountMinor={payAmountMinor}
              headcount={Number.parseInt(headcount, 10) || undefined}
              remainingHeadcount={Number.parseInt(headcount, 10) || undefined}
              favoritesOnly={favoritesOnly}
              instantAutoApprove={instantAutoApprove}
              amenities={amenities}
              requiredDocumentTypes={requiredDocumentTypes}
              notes={notes.trim() || undefined}
            />
          </JobCard>
          {selectedBranch ? (
            <LocationMap
              pin={{
                latitude: selectedBranch.latitude,
                longitude: selectedBranch.longitude,
              }}
              pinLabel={selectedBranch.name}
            />
          ) : null}
          <TokenCostPreview
            available={tokenAvailable}
            need={Number.parseInt(headcount, 10) || 0}
          />
          <TextField
            label={t('employer:jobs.notes')}
            multiline
            numberOfLines={3}
            onChangeText={setNotes}
            value={notes}
          />
        </View>
      ) : null}
      </WizardShell>
    </ModulePage>
  );
}
