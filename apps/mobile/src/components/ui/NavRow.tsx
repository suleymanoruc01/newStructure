import React from 'react';
import { Text, View } from 'react-native';

import { ClayCard } from './ClayCard';

type NavRowProps = {
  label: string;
  onPress: () => void;
  value?: string;
  testID?: string;
};

export function NavRow({ label, onPress, value, testID }: NavRowProps) {
  return (
    <ClayCard className="mb-3" onPress={onPress} testID={testID}>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans flex-1 text-base font-semibold text-text-high">
          {label}
        </Text>
        <View className="flex-row items-center">
          {value ? (
            <Text className="font-sans mr-2 text-sm font-medium text-text-low">
              {value}
            </Text>
          ) : null}
          <Text className="font-sans text-xl text-text-low">›</Text>
        </View>
      </View>
    </ClayCard>
  );
}
