import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';

type Props = {
  body: string;
  ctaLabel: string;
  onReauth: () => void;
};

export function SessionExpiredCard({
  body,
  ctaLabel,
  onReauth,
}: Props) {
  return (
    <View className="w-full">
      <Text className="font-sans text-base text-text-medium">{body}</Text>
      <View className="mt-8 w-full">
        <Button label={ctaLabel} onPress={onReauth} />
      </View>
    </View>
  );
}
