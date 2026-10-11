import React from 'react';
import { Text } from 'react-native';

import { Pressable } from './Pressable';

type NavRowProps = {
  label: string;
  onPress: () => void;
};

export function NavRow({ label, onPress }: NavRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="border-b border-surface-2 py-3"
      onPress={onPress}
    >
      <Text className="font-sans text-base text-action-secondary">{label}</Text>
    </Pressable>
  );
}
