import React from 'react';
import { Text, View } from 'react-native';

import { Button } from './Button';
import { ClayCard } from './ClayCard';

export type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  testID?: string;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionVariant = 'secondary',
  icon,
  testID,
}: EmptyStateProps) {
  return (
    <ClayCard testID={testID} className="items-center py-6 text-center">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-surface-2/80">
        <Text className="text-2xl">{icon ?? '📋'}</Text>
      </View>
      <Text className="text-center font-display text-lg font-bold text-text-high">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center font-sans text-sm leading-5 text-text-medium">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-5 w-full max-w-[240px]">
          <Button
            label={actionLabel}
            onPress={onAction}
            variant={actionVariant}
          />
        </View>
      ) : null}
    </ClayCard>
  );
}
