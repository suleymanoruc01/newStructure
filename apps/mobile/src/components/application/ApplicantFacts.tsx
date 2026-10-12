import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
}: {
  snapshot: ProfileFacts | null | undefined;
  sectors: Catalog;
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

  return (
    <View className="gap-1">
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
