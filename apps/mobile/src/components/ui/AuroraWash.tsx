import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const MUSTARD = '#E2B83F';
const ORANGE = '#E97A3D';
const LEAF = '#79A94B';
/** Aurora UI (8–12s). Off when Reduce Motion / Reduce Transparency is on. */
const LOOP_MS = 10000;

function Glow({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style: object;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Forest/orange/mustard/leaf aurora — never purple. */
export function AuroraWash({ variant }: { variant: 'forest' | 'cream' }) {
  const [solid, setSolid] = useState(false);
  const [still, setStill] = useState(false);
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) {
        setSolid(value);
      }
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setStill(value);
      }
    });
    const transparency = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setSolid,
    );
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setStill,
    );
    return () => {
      mounted = false;
      transparency.remove();
      motion.remove();
    };
  }, []);

  useEffect(() => {
    if (solid || still) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: LOOP_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: LOOP_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, solid, still]);

  if (solid) {
    return null;
  }

  const shift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });
  const back = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const forest = variant === 'forest';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Glow
        color={ORANGE}
        size={forest ? 220 : 180}
        style={{
          top: forest ? -70 : -40,
          right: forest ? -50 : -36,
          opacity: forest ? 0.55 : 0.18,
          transform: [{ translateX: back }, { translateY: shift }],
        }}
      />
      <Glow
        color={MUSTARD}
        size={forest ? 160 : 140}
        style={{
          top: forest ? 36 : 8,
          right: forest ? 28 : 40,
          opacity: forest ? 0.28 : 0.16,
          transform: [{ translateX: shift }],
        }}
      />
      <Glow
        color={LEAF}
        size={forest ? 200 : 200}
        style={{
          bottom: forest ? -80 : -60,
          left: forest ? -40 : -48,
          opacity: forest ? 0.4 : 0.14,
          transform: [{ translateY: back }],
        }}
      />
      {forest ? (
        <>
          <Glow
            color={CREAM}
            size={120}
            style={{
              bottom: 8,
              right: -20,
              opacity: 0.16,
              transform: [{ translateX: shift }],
            }}
          />
          <BlurView
            blurAmount={48}
            blurType="dark"
            pointerEvents="none"
            reducedTransparencyFallbackColor={FOREST}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
    </View>
  );
}
