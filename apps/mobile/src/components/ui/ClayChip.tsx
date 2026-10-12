import React from 'react';
import { Text } from 'react-native';

import { clayChip } from './clay';
import { Pressable } from './Pressable';

export function ClayChip({
  label,
  selected = false,
  tone = 'primary',
  onPress,
  testID,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  label: string;
  selected?: boolean;
  tone?: 'primary' | 'accent';
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio';
}) {
  const fill = selected
    ? tone === 'accent'
      ? 'bg-accent-mustard'
      : 'bg-action-primary'
    : 'bg-surface-1';
  const text =
    selected && tone === 'primary' ? 'text-text-on' : 'text-text-high';
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={clayChip(selected)}
      testID={testID}
      className={`min-h-11 items-center justify-center rounded-full px-3 py-2 ${fill}`}
    >
      <Text className={`font-sans text-sm ${text}`}>{label}</Text>
    </Pressable>
  );
}
