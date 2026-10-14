import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { clayButton } from './clay';
import { Pressable } from './Pressable';
import { triggerHaptic } from '../../shared/ui/haptics';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  shape?: 'rect' | 'capsule';
  testID?: string;
  className?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
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

  const isInteractive = !disabled && !loading;

  const handlePress = () => {
    if (!isInteractive) return;
    triggerHaptic(variant === 'destructive' ? 'medium' : 'light');
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      disabled={!isInteractive}
      onPress={isInteractive ? handlePress : undefined}
      testID={testID}
      style={clayStyle}
      className={`${
        ghost ? 'min-h-12' : capsule ? 'min-h-14 rounded-full' : 'min-h-12 rounded-lg'
      } items-center justify-center px-5 ${shell} ${!isInteractive ? 'opacity-40' : ''} ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={onColor ? '#FFFFFF' : '#344A32'}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon ? <View>{icon}</View> : null}
          <Text
            className={
              onColor
                ? 'text-center font-sans text-base font-semibold text-text-on'
                : 'text-center font-sans text-base font-semibold text-action-secondary'
            }
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
