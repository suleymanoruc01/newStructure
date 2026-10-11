import React from 'react';
import { Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  testID?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
}: ButtonProps) {
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={
        primary
          ? `rounded-full px-4 py-3 ${disabled ? 'bg-text-low' : 'bg-action-primary active:bg-action-primary-pressed'}`
          : 'rounded-full px-4 py-3'
      }
    >
      <Text
        className={
          primary
            ? 'text-center text-base font-semibold text-text-on'
            : 'text-center text-base font-semibold text-forest'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
