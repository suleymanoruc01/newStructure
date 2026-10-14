import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CandidateScoreBreakdown } from '@parton/api-contracts';

type ProfileFacts = {
  birthDate?: string | null;
  gender?: string | null;
  sectorCodes: string[];
  occupationCodes: string[];
};

type Catalog = {
  code: string;
  displayName: string;
  occupations: { code: string; title: string }[];
}[];

export function ageYears(iso: string | null | undefined): number | null {
  if (!iso) {
    return null;
  }
  const birth = new Date(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(birth.getTime())) {
    return null;
  }
  const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const month = now.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < birth.getUTCDate())) {
    years -= 1;
  }
  return years >= 0 && years < 130 ? years : null;
}

export function ApplicantFacts({
  snapshot,
  sectors,
  candidateScore,
}: {
  snapshot: ProfileFacts | null | undefined;
  sectors: Catalog;
  candidateScore?: CandidateScoreBreakdown | null;
}) {
  const { t } = useTranslation(['worker', 'employer']);
  const sectorCodes = snapshot?.sectorCodes ?? [];
  const occupationCodes = snapshot?.occupationCodes ?? [];
  const sectorNames = useMemo(
    () =>
      sectorCodes.map(
        (code) =>
          (sectors ?? []).find((sector) => sector.code === code)?.displayName ??
          code,
      ),
    [sectorCodes, sectors],
  );
  const occupationNames = useMemo(() => {
    const rows = (sectors ?? []).flatMap((sector) => sector.occupations ?? []);
    return occupationCodes.map(
      (code) => rows.find((row) => row.code === code)?.title ?? code,
    );
  }, [occupationCodes, sectors]);
  if (!snapshot) {
    return null;
  }
  const age = ageYears(snapshot.birthDate);
  const gender =
    snapshot.gender && snapshot.gender !== 'unspecified'
      ? t(`worker:profile.gender.${snapshot.gender}`, {
          defaultValue: snapshot.gender,
        })
      : null;

  const totalScore = candidateScore?.totalScore ?? 0;
  const isHighMatch = totalScore >= 85;
  const isStrongMatch = totalScore >= 70;

  const cardBorderClass = isHighMatch
    ? 'border-primary-solid/40 bg-primary-solid/5'
    : isStrongMatch
      ? 'border-primary/25 bg-primary/5'
      : 'border-surface-border bg-surface-1';

  const badgeTitle =
    candidateScore?.badge === 'top_talent'
      ? '✨ VIP Yetenek'
      : candidateScore?.badge === 'verified_pro'
        ? '🛡️ Doğrulanmış Pro'
        : candidateScore?.badge === 'rising_star'
          ? '⭐ Yükselen Yıldız'
          : candidateScore?.badge === 'reliable'
            ? '⚡ Güvenilir'
            : 'Standart Uyum';

  return (
    <View className="gap-1.5">
      {candidateScore ? (
        <View className={`mb-1 rounded-2xl border p-2.5 ${cardBorderClass}`}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-xs font-bold text-primary-solid">
              {badgeTitle}
            </Text>
            <View className="rounded-full bg-primary-solid px-2 py-0.5">
              <Text className="font-sans text-xs font-bold text-white">
                {`%${candidateScore.totalScore} Uyum`}
              </Text>
            </View>
          </View>

          {/* Visual Match Meter */}
          <View className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-border/50">
            <View
              className={`h-full rounded-full ${
                isHighMatch
                  ? 'bg-primary-solid'
                  : isStrongMatch
                    ? 'bg-accent-mustard'
                    : 'bg-text-low'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, candidateScore.totalScore))}%` }}
            />
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {candidateScore.averageRating != null ? (
              <View className="rounded-md border border-surface-border/60 bg-surface-1 px-1.5 py-0.5">
                <Text className="font-sans text-xs font-medium text-text-medium">
                  {`★ ${candidateScore.averageRating.toFixed(1)} (${candidateScore.ratingCount ?? 0})`}
                </Text>
              </View>
            ) : null}
            <View className="rounded-md border border-surface-border/60 bg-surface-1 px-1.5 py-0.5">
              <Text className="font-sans text-xs font-medium text-text-medium">
                {`✓ ${candidateScore.completedShiftsCount} vardiya`}
              </Text>
            </View>
            <View className="rounded-md border border-surface-border/60 bg-surface-1 px-1.5 py-0.5">
              <Text className="font-sans text-xs font-medium text-text-medium">
                {`⚡ %${candidateScore.reliabilityScore} devamlılık`}
              </Text>
            </View>
            <View className="rounded-md border border-surface-border/60 bg-surface-1 px-1.5 py-0.5">
              <Text className="font-sans text-xs font-medium text-text-medium">
                {`📍 %${candidateScore.proximityScore} konum`}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
      {gender ? (
        <Text className="font-sans text-sm text-text-medium">{gender}</Text>
      ) : null}
      {age != null ? (
        <Text className="font-sans text-sm text-text-medium">
          {t('employer:applicants.age', { years: age })}
        </Text>
      ) : null}
      {sectorNames.length > 0 ? (
        <Text className="font-sans text-sm text-text-medium">
          {sectorNames.join(' · ')}
        </Text>
      ) : null}
      {occupationNames.length > 0 ? (
        <Text className="font-sans text-sm text-text-medium">
          {occupationNames.join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}
