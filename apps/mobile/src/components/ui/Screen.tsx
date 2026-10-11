import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
};

export function Screen({ children, scroll = false, testID }: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-surface-base" testID={testID}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-4 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-base px-4 py-6" testID={testID}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
