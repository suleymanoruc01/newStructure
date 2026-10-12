import type { Shift } from '@parton/api-contracts';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { remainingLabel } from '../../shared/datetime/countdown';
import { Button } from '../ui/Button';
import { JobCard } from './JobCard';
import { ShiftFacts } from './ShiftFacts';

export function Confirm3hCard({
  shift,
  untitled,
  ctaLabel,
  onPress,
}: {
  shift: Shift;
  untitled: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('worker');
  const remaining = shift.confirmWindow?.deadlineAt
    ? remainingLabel(shift.confirmWindow.deadlineAt)
    : null;
  return (
    <JobCard
      status={shift.status}
      title={shift.jobTitle ?? shift.branchName ?? untitled}
      onPress={onPress}
    >
      {remaining ? (
        <Text className="font-sans text-sm font-semibold text-action-primary">
          {t('home.confirmLeft', { time: remaining })}
        </Text>
      ) : null}
      <View className="mt-2">
        <ShiftFacts shift={shift} />
      </View>
      <View className="mt-3">
        <Button label={ctaLabel} onPress={onPress} />
      </View>
    </JobCard>
  );
}
