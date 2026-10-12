import React from 'react';
import { Text, View } from 'react-native';
import { clayCard } from '../../../../components/ui/clay';
import { Pressable } from '../../../../components/ui/Pressable';

export type TopUpPackageOption = {
  id: string;
  label: string;
  tokenCount: number;
  priceTry: number;
  isPopular?: boolean;
};

type Props = {
  packages: TopUpPackageOption[];
  selectedId: string | null;
  onSelect: (pkg: TopUpPackageOption) => void;
  priceLabelFor: (priceTry: number) => string;
};

export function TopUpAmountPicker({
  packages,
  selectedId,
  onSelect,
  priceLabelFor,
}: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {packages.map((pkg) => {
        const active = selectedId === pkg.id;
        return (
          <Pressable
            key={pkg.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={clayCard}
            className={`rounded-[22px] px-4 py-3 ${
              active ? 'bg-accent-mustard' : 'bg-surface-1'
            }`}
            onPress={() => onSelect(pkg)}
          >
            <Text className="font-sans text-base font-semibold text-text-high">
              {pkg.label}
            </Text>
            <Text className="font-sans text-xs text-text-medium">
              {priceLabelFor(pkg.priceTry)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
