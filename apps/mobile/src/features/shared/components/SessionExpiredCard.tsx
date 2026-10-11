import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';

type Props = {
  title: string;
  body: string;
  ctaLabel: string;
  onReauth: () => void;
};

export function SessionExpiredCard({
  title,
  body,
  ctaLabel,
  onReauth,
}: Props) {
  return (
    <View className="w-full items-center px-6">
      <Text className="text-2xl font-bold text-text-high">{title}</Text>
      <Text className="mt-3 text-center text-base text-text-medium">{body}</Text>
      <View className="mt-8 w-full">
        <Button label={ctaLabel} onPress={onReauth} />
      </View>
    </View>
  );
}
