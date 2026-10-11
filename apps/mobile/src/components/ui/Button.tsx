import React from 'react';
import { Text, type ViewStyle } from 'react-native';

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
  shape = 'rect',
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
  const clayStyle: ViewStyle | undefined = clay
    ? {
        shadowColor: '#252823',
        shadowOffset: { width: 4, height: 10 },
        shadowOpacity: 0.32,
        shadowRadius: 12,
        elevation: 8,
        borderTopWidth: 2,
        borderTopColor: 'rgba(243, 232, 207, 0.7)',
        borderBottomWidth: 6,
        borderBottomColor: variant === 'primary' ? '#B94E32' : '#252823',
      }
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
