import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  hint: string;
};

export function TenantMismatchExplain({ hint }: Props) {
  return (
    <View className="mt-6 rounded-2xl bg-surface-1 p-4">
      <Text className="font-sans text-sm text-text-medium">{hint}</Text>
    </View>
  );
}
