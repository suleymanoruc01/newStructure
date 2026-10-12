import React from 'react';
import { Text } from 'react-native';

import { clayButton } from './clay';
import { Pressable } from './Pressable';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  shape?: 'rect' | 'capsule';
  testID?: string;
  className?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  shape = 'capsule',
  testID,
  className,
}: ButtonProps) {
  const filled = variant === 'primary' || variant === 'destructive';
  const ghost = variant === 'ghost';
  const capsule = shape === 'capsule';
  const forest = capsule && variant === 'secondary';
  const fill =
    variant === 'destructive'
      ? 'bg-feedback-error'
      : 'bg-action-primary active:bg-action-primary-pressed';
  const shell = filled
    ? fill
    : ghost
      ? 'bg-transparent'
      : forest
        ? 'bg-action-secondary'
        : 'border border-action-secondary bg-transparent';
  const onColor = filled || forest;
  const clay = capsule && !ghost && (filled || forest);
  const clayStyle = clay
    ? clayButton(variant === 'primary' || variant === 'destructive' ? 'primary' : 'forest')
    : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={clayStyle}
      className={`${
        ghost ? 'min-h-12' : capsule ? 'min-h-14 rounded-full' : 'min-h-12 rounded-lg'
      } items-center justify-center px-5 ${shell} ${disabled ? 'opacity-40' : ''} ${className ?? ''}`}
    >
      <Text
        className={
          onColor
            ? 'text-center font-sans text-base font-semibold text-text-on'
            : 'text-center font-sans text-base font-semibold text-action-secondary'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
