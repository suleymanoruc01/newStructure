import React from 'react';
import { Text, View } from 'react-native';

import { Button } from './Button';
import { WizardSteps } from './WizardSteps';

export function WizardShell({
  step,
  total,
  heading,
  hint,
  error,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  extraFooter,
  children,
}: {
  step: number;
  total: number;
  heading?: string;
  hint?: string;
  error?: string | null;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  extraFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View>
      <WizardSteps step={step} total={total} />
      {heading ? (
        <Text className="font-display mt-1 text-xl font-semibold text-text-high">
          {heading}
        </Text>
      ) : null}
      {hint ? (
        <Text className="font-sans mt-1 text-sm leading-5 text-text-medium">
          {hint}
        </Text>
      ) : null}
      <View className="mt-4 gap-3">{children}</View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6 gap-3">
        <Button
          disabled={primaryDisabled}
          label={primaryLabel}
          onPress={onPrimary}
        />
        {extraFooter}
      </View>
    </View>
  );
}
