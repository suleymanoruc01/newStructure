import React from 'react';
import { View } from 'react-native';

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          className="h-24 rounded-[22px] bg-surface-2"
        />
      ))}
    </View>
  );
}
