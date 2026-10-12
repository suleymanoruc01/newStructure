import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatIstanbul, useDisplayTimeZone } from '../../shared/datetime/istanbul';
import { formatPayTry } from '../../shared/format/pay';
import { StatusBadge } from '../ui/StatusBadge';

type JobFactsProps = {
  branchName?: string | null;
  startsAt: string;
  endsAt: string;
  payAmountMinor?: number | null;
  payCurrency?: string;
  distanceKm?: number | null;
  headcount?: number;
  remainingHeadcount?: number;
  favoritesOnly?: boolean;
  instantAutoApprove?: boolean;
  matchReasons?: string[];
  requiredDocumentTypes?: string[];
  amenities?: string[];
  notes?: string | null;
};

export function JobFacts({
  branchName,
  startsAt,
  endsAt,
  payAmountMinor,
  payCurrency = 'TRY',
  distanceKm,
  headcount,
  remainingHeadcount,
  favoritesOnly,
  instantAutoApprove,
  matchReasons,
  requiredDocumentTypes,
  amenities,
  notes,
}: JobFactsProps) {
  const { t } = useTranslation(['worker', 'employer']);
  const timeZone = useDisplayTimeZone();
  const pay = formatPayTry(payAmountMinor, payCurrency);
  const seats =
    remainingHeadcount != null && headcount != null
      ? t('worker:jobs.seats', { remaining: remainingHeadcount, total: headcount })
      : headcount != null
        ? t('worker:jobs.headcount', { count: headcount })
        : null;

  return (
    <View>
      {pay ? (
        <Text className="font-display text-xl font-semibold text-text-high">{pay}</Text>
      ) : null}
      {branchName ? (
        <Text className="font-sans mt-1 text-sm text-text-medium">{branchName}</Text>
      ) : null}
      <Text className="font-sans mt-1 text-sm text-text-medium">
        {formatIstanbul(startsAt, timeZone)} – {formatIstanbul(endsAt, timeZone)}
      </Text>
      {typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? (
        <Text className="font-sans mt-1 text-sm text-text-low">
          {t('worker:jobs.distance', { km: distanceKm.toFixed(1) })}
        </Text>
      ) : null}
      {seats ? (
        <Text className="font-sans mt-1 text-sm text-text-medium">{seats}</Text>
      ) : null}
      {instantAutoApprove || favoritesOnly ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {instantAutoApprove ? (
            <StatusBadge
              label={t('worker:jobs.instantBadge')}
              tone="strong"
            />
          ) : null}
          {favoritesOnly ? (
            <StatusBadge label={t('worker:jobs.favoritesOnlyBadge')} />
          ) : null}
        </View>
      ) : null}
      {matchReasons && matchReasons.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {matchReasons.map((reason) => (
            <StatusBadge
              key={reason}
              label={t(`worker:jobs.matchReasons.${reason}`, {
                defaultValue: reason,
              })}
            />
          ))}
        </View>
      ) : null}
      {requiredDocumentTypes && requiredDocumentTypes.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {requiredDocumentTypes.map((type) => (
            <StatusBadge
              key={type}
              label={t(`worker:documents.types.${type}`, { defaultValue: type })}
            />
          ))}
        </View>
      ) : null}
      {amenities && amenities.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {amenities.map((code) => (
            <StatusBadge
              key={code}
              label={t(`worker:jobs.amenity.${code}`, { defaultValue: code })}
            />
          ))}
        </View>
      ) : null}
      {notes ? (
        <Text className="font-sans mt-3 text-sm text-text-medium">{notes}</Text>
      ) : null}
    </View>
  );
}
