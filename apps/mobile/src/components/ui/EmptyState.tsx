import React from 'react';
import { Text } from 'react-native';

import { Button } from './Button';
import { ClayCard } from './ClayCard';

export function EmptyState({
  title,
  actionLabel,
  onAction,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  return (
    <ClayCard testID={testID}>
      <Text className="font-display text-lg font-semibold text-text-high">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Button
          className="mt-4"
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
        />
      ) : null}
    </ClayCard>
  );
}
