import React from 'react';
import { Text, View } from 'react-native';

import { clayCard } from './clay';

export type StatItem = {
  label: string;
  value: string;
  tone?: 'default' | 'strong' | 'accent' | 'warn';
  trend?: string;
  testID?: string;
};

export function StatStrip({
  items,
}: {
  items: StatItem[];
}) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {items.map((item) => {
        const tone = item.tone ?? 'default';
        const borderTone =
          tone === 'strong'
            ? 'border-l-4 border-emerald-500 bg-emerald-500/5'
            : tone === 'accent'
              ? 'border-l-4 border-accent-mustard bg-accent-mustard/5'
              : tone === 'warn'
                ? 'border-l-4 border-amber-500 bg-amber-500/5'
                : 'border-l-2 border-surface-border bg-surface-1';

        return (
          <View
            key={item.label}
            style={clayCard}
            testID={item.testID}
            className={`min-w-[96px] flex-1 rounded-[20px] px-3.5 py-2.5 ${borderTone}`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-xl font-bold tracking-tight text-text-high">
                {item.value}
              </Text>
              {item.trend ? (
                <View className="rounded-full bg-surface-2 px-1.5 py-0.5">
                  <Text className="font-sans text-[10px] font-semibold text-text-medium">
                    {item.trend}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="font-sans mt-0.5 text-xs font-medium text-text-medium">
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
