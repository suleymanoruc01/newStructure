import React from 'react';
import { Text, View } from 'react-native';
import { ClayCard } from '../../../../components/ui/ClayCard';

type MethodId = 'sandbox_card';

type Props = {
  selected: MethodId;
  onSelect: (id: MethodId) => void;
  title: string;
  sandboxLabel: string;
};

export function PaymentMethodList({
  selected,
  onSelect,
  title,
  sandboxLabel,
}: Props) {
  const active = selected === 'sandbox_card';
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text-medium">{title}</Text>
      <ClayCard onPress={() => onSelect('sandbox_card')}>
        <Text className="font-sans text-base font-medium text-text-high">
          {sandboxLabel}
          {active ? ' ✓' : ''}
        </Text>
      </ClayCard>
    </View>
  );
}
