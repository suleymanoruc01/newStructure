import { statusLabelTr } from '@parton/api-contracts';
import React from 'react';
import { Text, View } from 'react-native';

import { ClayCard } from '../ui/ClayCard';
import { StatusBadge, statusTone } from '../ui/StatusBadge';

export function JobCard({
  title,
  status,
  onPress,
  disabled,
  children,
}: {
  title: string;
  status?: string | null;
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <ClayCard disabled={disabled} onPress={onPress}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="font-display flex-1 text-lg font-semibold text-text-high">
          {title}
        </Text>
        {status ? (
          <StatusBadge label={statusLabelTr(status)} tone={statusTone(status)} />
        ) : null}
      </View>
      {children ? <View className="mt-2">{children}</View> : null}
    </ClayCard>
  );
}
