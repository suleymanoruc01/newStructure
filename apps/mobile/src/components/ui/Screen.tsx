import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
  dock?: boolean;
  bleed?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  children,
  scroll = false,
  testID,
  dock = false,
  bleed = false,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const edges = bleed
    ? (['left', 'right'] as const)
    : dock
      ? (['top', 'left', 'right'] as const)
      : undefined;
  const pad = bleed
    ? dock
      ? 'pb-32'
      : ''
    : dock
      ? 'px-4 pb-32 pt-6'
      : 'px-4 py-6';
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-surface-base" edges={edges} testID={testID}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={`grow ${pad}`}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                colors={['#E97A3D']}
                refreshing={refreshing}
                tintColor="#E97A3D"
                onRefresh={onRefresh}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 bg-surface-base ${pad}`} edges={edges} testID={testID}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
