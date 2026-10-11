import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  body: string;
};

export function ForbiddenState({ title, body }: Props) {
  return (
    <View className="items-center px-6">
      <Text className="text-2xl font-bold text-text-high">{title}</Text>
      <Text className="mt-3 text-center text-base text-text-medium">{body}</Text>
    </View>
  );
}
