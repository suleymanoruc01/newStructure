import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
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
import DatePicker from 'react-native-date-picker';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { listBranches } from '../../../api/branches-api';
import { fetchEmployerMe } from '../../../api/employers-api';
import { createBranchJob, createJob, fetchJobCatalog } from '../../../api/jobs-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { formatPayTry, tryMajorToMinor } from '../../../shared/format/pay';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';
import { SHIFT_DURATIONS_H } from '../../../shared/datetime/shift-when';
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

function formatPickerLabel(d: Date): string {
  try {
    const day = d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
    const time = d.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${day} · ${time}`;
  } catch {
    return d.toLocaleString('tr-TR');
  }
}

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerCreateJob'>;

type CatalogSector = Awaited<ReturnType<typeof fetchJobCatalog>>['sectors'][number];
type BranchItem = Awaited<ReturnType<typeof listBranches>>['items'][number];

export function EmployerCreateJobScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'worker', 'common', 'errors']);
  const { contexts } = useAuth();
  const timeZone = useDisplayTimeZone();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [sectors, setSectors] = useState<CatalogSector[]>([]);
  const [branchId, setBranchId] = useState('');
  const [workplacePin, setWorkplacePin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [workplaceLabel, setWorkplaceLabel] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [occupationCode, setOccupationCode] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [payTry, setPayTry] = useState('');
  const [tokenAvailable, setTokenAvailable] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d;
  });
  const [activeTimeTab, setActiveTimeTab] = useState<'start' | 'end'>('start');
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
        const branchItems = branchList.items ?? [];
        setBranches(branchItems);
        if (
          employer.latitude != null &&
          employer.longitude != null
        ) {
          setWorkplacePin({
            latitude: employer.latitude,
            longitude: employer.longitude,
          });
          setWorkplaceLabel(
            employer.tradingName ?? employer.legalName,
          );
        }
        if (branchItems.length === 1 && employer.latitude == null) {
          setBranchId(branchItems[0]!.id);
        }
        const catalogSectors = catalog.sectors ?? [];
        setSectors(catalogSectors);
        if (catalogSectors.length === 1) {
          const only = catalogSectors[0]!;
          setSectorCode(only.code);
          const onlyOccupations = only.occupations ?? [];
          if (onlyOccupations.length === 1) {
            setOccupationCode(onlyOccupations[0]!.code);
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

  const sectorRows = sectors ?? [];
  const occupations =
    sectorRows.find((sector) => sector.code === sectorCode)?.occupations ?? [];
  const sectorNeedle = sectorQuery.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = sectorNeedle
    ? sectorRows.filter((sector) =>
        (sector.displayName ?? '').toLocaleLowerCase('tr-TR').includes(sectorNeedle),
      )
    : sectorRows;
  const occupationNeedle = occupationQuery.trim().toLocaleLowerCase('tr-TR');
  const shownOccupations = occupationNeedle
    ? occupations.filter((row) =>
        (row.title ?? '').toLocaleLowerCase('tr-TR').includes(occupationNeedle),
      )
    : occupations;
  const branchNeedle = branchQuery.trim().toLocaleLowerCase('tr-TR');
  const shownBranches = branchNeedle
    ? branches.filter((branch) =>
        (branch.name ?? '').toLocaleLowerCase('tr-TR').includes(branchNeedle),
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
      if (!branchId && !workplacePin) {
        setError(
          workplacePin
            ? t('employer:jobs.branchRequired')
            : t('employer:jobs.workplaceLocationMissing'),
        );
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
      if (endDate.getTime() <= startDate.getTime()) {
        setError(t('employer:jobs.timeOrderInvalid', { defaultValue: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır.' }));
        return;
      }
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
      if (!branchId && !workplacePin) {
        throw new ApiClientError(
          t('employer:jobs.workplaceLocationMissing'),
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
      if (endDate.getTime() <= startDate.getTime()) {
        throw new ApiClientError(
          t('employer:jobs.timeOrderInvalid', { defaultValue: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır.' }),
          400,
          'VALIDATION_FAILED',
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
      const { startsAt, endsAt } = when;
      const jobBody = {
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
      };
      if (branchId) {
        await createBranchJob(branchId, jobBody, token);
      } else {
        await createJob(jobBody, token);
      }
      navigation.navigate('EmployerJobsList');
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const branchName = selectedBranch?.name ?? (branchId ? undefined : workplaceLabel);
  const sectorName = sectorRows.find((sector) => sector.code === sectorCode)?.displayName;
  const occupationName = occupations.find((row) => row.code === occupationCode)?.title;
  const when = useMemo(() => {
    const startsAt = startDate.toISOString();
    const endsAt = endDate.toISOString();
    const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
    const diffMin = Math.round(diffMs / 60000);
    const durationHours = Math.round((diffMin / 60) * 10) / 10;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    const durationFormatted = m > 0 ? `${h} sa ${m} dk` : `${h} saat`;
    const isNextDay =
      endDate.getFullYear() !== startDate.getFullYear() ||
      endDate.getMonth() !== startDate.getMonth() ||
      endDate.getDate() !== startDate.getDate();
    return {
      startsAt,
      endsAt,
      durationHours,
      durationMinutes: diffMin,
      isNextDay,
      durationFormatted,
    };
  }, [startDate, endDate]);
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
            {workplacePin ? (
              <ClayChip
                label={t('employer:jobs.workplaceSite')}
                selected={branchId === ''}
                onPress={() => setBranchId('')}
              />
            ) : null}
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
          {sectorRows.length > 6 ? (
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
        <View className="gap-3.5">
          {/* Segmented Switcher: Başlangıç vs Bitiş */}
          <View
            className="flex-row rounded-2xl bg-surface-1 p-1"
            style={clayCard}
          >
            <Pressable
              onPress={() => setActiveTimeTab('start')}
              className={`flex-1 items-center justify-center rounded-xl py-2.5 px-2 ${
                activeTimeTab === 'start' ? 'bg-action-primary' : 'bg-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTimeTab === 'start' }}
              testID="employer.createJob.tabStart"
            >
              <Text
                className={`font-sans text-xs font-semibold uppercase tracking-wider ${
                  activeTimeTab === 'start' ? 'text-text-on' : 'text-text-low'
                }`}
              >
                {t('employer:jobs.whenStart', { defaultValue: 'Başlangıç' })}
              </Text>
              <Text
                className={`mt-0.5 font-display text-sm font-bold ${
                  activeTimeTab === 'start' ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {formatPickerLabel(startDate)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTimeTab('end')}
              className={`flex-1 items-center justify-center rounded-xl py-2.5 px-2 ${
                activeTimeTab === 'end' ? 'bg-action-primary' : 'bg-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTimeTab === 'end' }}
              testID="employer.createJob.tabEnd"
            >
              <View className="flex-row items-center gap-1">
                <Text
                  className={`font-sans text-xs font-semibold uppercase tracking-wider ${
                    activeTimeTab === 'end' ? 'text-text-on' : 'text-text-low'
                  }`}
                >
                  {t('employer:jobs.whenEnd', { defaultValue: 'Bitiş' })}
                </Text>
                {when.isNextDay ? (
                  <Text className="text-xs">🌙</Text>
                ) : null}
              </View>
              <Text
                className={`mt-0.5 font-display text-sm font-bold ${
                  activeTimeTab === 'end' ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {formatPickerLabel(endDate)}
              </Text>
            </Pressable>
          </View>

          {/* Clean Inline Wheel DatePicker matching the Android sample GIF */}
          <View
            className="items-center justify-center rounded-3xl bg-surface-1 py-3 px-2"
            style={clayCard}
          >
            <DatePicker
              date={activeTimeTab === 'start' ? startDate : endDate}
              onDateChange={(newDate) => {
                if (activeTimeTab === 'start') {
                  const currentDurationMs = Math.max(
                    3600 * 1000,
                    endDate.getTime() - startDate.getTime(),
                  );
                  setStartDate(newDate);
                  // Preserve shift duration when moving start date
                  setEndDate(new Date(newDate.getTime() + currentDurationMs));
                } else {
                  setEndDate(newDate);
                }
              }}
              mode="datetime"
              locale="tr"
              is24hourSource="locale"
              theme="light"
              dividerColor="#E97A3D"
              testID="employer.createJob.inlinePicker"
            />
          </View>

          {/* Quick Duration Presets */}
          <View className="gap-1.5">
            <Text className="font-sans text-xs font-semibold text-text-low uppercase tracking-wider">
              {t('employer:jobs.whenHours', { defaultValue: 'Hızlı Süre Seçimi' })}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SHIFT_DURATIONS_H.map((hours) => {
                const isSelected = when.durationHours === hours;
                return (
                  <ClayChip
                    key={hours}
                    label={`${hours} saat`}
                    selected={isSelected}
                    onPress={() => {
                      setEndDate(new Date(startDate.getTime() + hours * 3600 * 1000));
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Timing Summary Card */}
          <View
            className="gap-2 rounded-2xl bg-surface-1 px-4 py-3"
            style={clayCard}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-sans text-xs font-semibold text-text-low">
                  {t('employer:jobs.wizard.when', { defaultValue: 'Vardiya Zamanı' })}
                </Text>
                <Text className="font-sans text-sm font-semibold text-text-high">
                  {formatPickerLabel(startDate)} → {formatPickerLabel(endDate)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {when.isNextDay ? (
                  <StatusBadge
                    label="Gece Vardiyası 🌙"
                    tone="warn"
                  />
                ) : null}
                <StatusBadge
                  label={when.durationFormatted || `${when.durationHours} sa`}
                  tone={endDate.getTime() <= startDate.getTime() ? 'error' : 'strong'}
                />
              </View>
            </View>
            {when.isNextDay ? (
              <Text className="font-sans text-xs text-text-low">
                Vardiya gece yarısını geçip ertesi gün sona ermektedir.
              </Text>
            ) : null}
            {endDate.getTime() <= startDate.getTime() ? (
              <Text className="font-sans text-xs font-semibold text-feedback-error">
                Bitiş zamanı başlangıçtan sonra olmalıdır.
              </Text>
            ) : null}
          </View>
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
          {selectedBranch || (!branchId && workplacePin) ? (
            <LocationMap
              pin={
                selectedBranch
                  ? {
                      latitude: selectedBranch.latitude,
                      longitude: selectedBranch.longitude,
                    }
                  : workplacePin!
              }
              pinLabel={selectedBranch?.name ?? workplaceLabel}
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
