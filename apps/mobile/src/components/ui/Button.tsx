import React from 'react';
import { Text } from 'react-native';

import { Pressable } from './Pressable';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
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
  const ghost = variant === 'ghost';
  const fill = disabled
    ? 'bg-text-low'
    : variant === 'destructive'
      ? 'bg-feedback-error'
      : 'bg-action-primary active:bg-action-primary-pressed';
  const shell = filled
    ? fill
    : ghost
      ? 'bg-transparent'
      : 'border-[1.5px] border-action-secondary bg-surface-base';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      className={`min-h-12 items-center justify-center rounded-lg px-4 ${shell} ${
        disabled && !filled ? 'opacity-40' : ''
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
