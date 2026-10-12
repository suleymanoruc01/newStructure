import React from 'react';
import { Platform, Text, View } from 'react-native';
import { ClayCard } from '../../../../components/ui/ClayCard';

export type PaymentMethodId = 'apple' | 'google' | 'sandbox_card';

type Props = {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  title: string;
  appleLabel: string;
  googleLabel: string;
  sandboxLabel: string;
  adaptyEnabled: boolean;
};

export function PaymentMethodList({
  selected,
  onSelect,
  title,
  appleLabel,
  googleLabel,
  sandboxLabel,
  adaptyEnabled,
}: Props) {
  const methods: { id: PaymentMethodId; label: string }[] = adaptyEnabled
    ? Platform.OS === 'ios'
      ? [{ id: 'apple', label: appleLabel }]
      : [{ id: 'google', label: googleLabel }]
    : [{ id: 'sandbox_card', label: sandboxLabel }];
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text-medium">{title}</Text>
      {methods.map((method) => {
        const active = selected === method.id;
        return (
          <ClayCard key={method.id} onPress={() => onSelect(method.id)}>
            <Text className="font-sans text-base font-medium text-text-high">
              {method.label}
              {active ? ' ✓' : ''}
            </Text>
          </ClayCard>
        );
      })}
    </View>
  );
}
