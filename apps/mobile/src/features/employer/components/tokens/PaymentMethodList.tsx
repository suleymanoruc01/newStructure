import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../../components/ui/Pressable';

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
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        className={`rounded-2xl border p-4 ${
          active ? 'border-brand-primary bg-surface-1' : 'border-transparent bg-surface-1'
        }`}
        onPress={() => onSelect('sandbox_card')}
      >
        <Text className="font-sans text-base font-medium text-text-high">
          {sandboxLabel}
        </Text>
      </Pressable>
    </View>
  );
}
