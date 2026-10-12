import React from 'react';
import { Text, View } from 'react-native';

import { ClayCard } from './ClayCard';

type NavRowProps = {
  label: string;
  onPress: () => void;
};

export function NavRow({ label, onPress }: NavRowProps) {
  return (
    <ClayCard className="mb-3" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans flex-1 text-base font-semibold text-text-high">
          {label}
        </Text>
        <Text className="font-sans ml-3 text-xl text-text-low">›</Text>
      </View>
    </ClayCard>
  );
}
