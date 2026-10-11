import { LiquidGlassView } from '@sbaiahmed1/react-native-blur';
import React from 'react';
import { Text } from 'react-native';

import { Pressable } from '../../../components/ui/Pressable';

const CREAM = '#F3E8CF';
const INK = '#252823';

type GlassCapsuleProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

/** iOS 26 UIGlassEffect capsule. Solid cream if Reduce Transparency is on. */
export function GlassCapsule({ label, onPress, disabled = false, testID }: GlassCapsuleProps) {
  return (
    <LiquidGlassView
      glassOpacity={0.3}
      glassTintColor={CREAM}
      glassType="regular"
      isInteractive
      reducedTransparencyFallbackColor={CREAM}
      style={{
        minHeight: 52,
        borderRadius: 26,
        overflow: 'hidden',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
      >
        <Text className="text-center font-sans text-base font-semibold" style={{ color: INK }}>
          {label}
        </Text>
      </Pressable>
    </LiquidGlassView>
  );
}
