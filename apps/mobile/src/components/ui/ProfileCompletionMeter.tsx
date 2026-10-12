import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { clayCard } from './clay';

/** Matches `computeWorkerCompletion` keys in workers.service. */
const TOTAL = 6;

export function ProfileCompletionMeter({
  complete,
  missing,
}: {
  complete: boolean;
  missing: string[];
}) {
  const { t } = useTranslation('worker');
  const filled = complete ? TOTAL : Math.max(0, TOTAL - missing.length);
  const pct = Math.round((filled / TOTAL) * 100);
  return (
    <View className="mt-3">
      <View
        style={clayCard}
        className="h-3 overflow-hidden rounded-full bg-surface-1"
      >
        <View
          className="h-3 rounded-full bg-action-primary"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="font-sans mt-1 text-xs text-text-medium">
        {t('worker:profile.meter', { filled, total: TOTAL })}
      </Text>
    </View>
  );
}
