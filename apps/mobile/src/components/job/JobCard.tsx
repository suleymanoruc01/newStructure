import { statusLabelTr } from '@parton/api-contracts';
import React from 'react';
import { Text, View } from 'react-native';

import { ClayCard } from '../ui/ClayCard';
import { StatusBadge, statusTone } from '../ui/StatusBadge';
import { triggerHaptic } from '../../shared/ui/haptics';

export function JobCard({
  title,
  status,
  matchScore,
  onPress,
  disabled,
  children,
}: {
  title: string;
  status?: string | null;
  matchScore?: number | null;
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const handlePress = onPress
    ? () => {
        triggerHaptic('light');
        onPress();
      }
    : undefined;

  return (
    <ClayCard disabled={disabled} onPress={handlePress}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="font-display flex-1 text-lg font-semibold text-text-high">
          {title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {typeof matchScore === 'number' && matchScore > 0 ? (
            <StatusBadge
              label={`%${matchScore}`}
              tone={
                matchScore >= 80 ? 'strong' : matchScore >= 60 ? 'warn' : 'neutral'
              }
            />
          ) : null}
          {status ? (
            <StatusBadge label={statusLabelTr(status)} tone={statusTone(status)} />
          ) : null}
        </View>
      </View>
      {children ? <View className="mt-2">{children}</View> : null}
    </ClayCard>
  );
}
