import React from 'react';
import { View } from 'react-native';

import { clayCard } from './clay';
import { Pressable } from './Pressable';

type ClayCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  testID?: string;
};

export function ClayCard({
  children,
  onPress,
  disabled = false,
  className,
  testID,
}: ClayCardProps) {
  const box = `rounded-[22px] bg-surface-1 px-4 py-4 ${className ?? ''}`;
  if (!onPress) {
    return (
      <View style={clayCard} className={box} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={clayCard}
      className={`${box} ${disabled ? 'opacity-40' : ''}`}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}
