import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type OverlapConflict = {
  applicationId: string;
  jobId?: string;
  startsAt?: string;
  endsAt?: string;
};

type Props = {
  conflicts: OverlapConflict[];
};

export function OverlapConflictCard({ conflicts }: Props) {
  const { t } = useTranslation(['worker']);

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <View
      className="mt-4 rounded-xl border border-feedback-warning bg-feedback-warning/10 p-3"
      testID="m.worker.jobs.apply-overlap"
    >
      <Text className="text-sm font-semibold text-text-high">
        {t('worker:apply.overlapTitle')}
      </Text>
      <Text className="mt-1 text-sm text-text-medium">
        {t('worker:apply.overlapWarn')}
      </Text>
      <View className="mt-3 gap-2">
        {conflicts.map((row) => (
          <View
            key={row.applicationId}
            className="rounded-lg bg-surface-1 p-3"
            testID="ConflictShiftRow"
          >
            {row.startsAt && row.endsAt ? (
              <Text className="text-xs text-text-medium">
                {new Date(row.startsAt).toLocaleString('tr-TR')} –{' '}
                {new Date(row.endsAt).toLocaleString('tr-TR')}
              </Text>
            ) : (
              <Text className="text-xs text-text-low">{row.applicationId}</Text>
            )}
          </View>
        ))}
      </View>
      <Text className="mt-3 text-xs text-text-medium">
        {t('worker:apply.overlapAck')}
      </Text>
    </View>
  );
}
