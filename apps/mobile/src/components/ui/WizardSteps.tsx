import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function WizardSteps({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const { t } = useTranslation('common');
  return (
    <View className="mb-4">
      <Text className="font-sans mb-2 text-sm font-semibold text-text-medium">
        {t('step', { current: step, total })}
      </Text>
      <View className="flex-row gap-1">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? 'bg-action-primary' : 'bg-surface-2'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
