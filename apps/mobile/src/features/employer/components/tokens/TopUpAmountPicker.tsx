import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../../components/ui/Pressable';

const PACKAGES = [10, 25, 50, 100, 250] as const;

type Props = {
  selected: number | null;
  onSelect: (amount: number) => void;
  labelFor: (amount: number) => string;
};

export function TopUpAmountPicker({ selected, onSelect, labelFor }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {PACKAGES.map((amount) => {
        const active = selected === amount;
        return (
          <Pressable
            key={amount}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`rounded-2xl px-4 py-3 ${
              active ? 'bg-accent-mustard' : 'bg-surface-1'
            }`}
            onPress={() => onSelect(amount)}
          >
            <Text className="font-sans text-base font-semibold text-text-high">
              {labelFor(amount)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
