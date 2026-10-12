import React from 'react';
import { Text, View } from 'react-native';

import { clayCard } from './clay';

export function StatStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View
          key={item.label}
          style={clayCard}
          className="min-w-[96px] rounded-[18px] bg-surface-1 px-3 py-2"
        >
          <Text className="font-display text-lg font-semibold text-text-high">
            {item.value}
          </Text>
          <Text className="font-sans mt-0.5 text-xs text-text-medium">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
