import React from 'react';
import { Text } from 'react-native';

import { Pressable } from './Pressable';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  testID?: string;
  className?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
  className,
}: ButtonProps) {
  const filled = variant === 'primary' || variant === 'destructive';
  const fill = disabled
    ? 'bg-text-low'
    : variant === 'destructive'
      ? 'bg-feedback-error'
      : 'bg-action-primary active:bg-action-primary-pressed';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={`font-sans min-h-12 items-center justify-center rounded-lg px-4 ${
        filled
          ? fill
          : 'border-[1.5px] border-action-secondary bg-transparent'
      } ${className ?? ''}`}
    >
      <Text
        className={
          filled
            ? 'text-center font-sans text-base font-semibold text-text-on'
            : 'text-center font-sans text-base font-semibold text-action-secondary'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
