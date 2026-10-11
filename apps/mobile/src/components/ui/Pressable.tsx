import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable as RNPressable,
  type PressableProps,
} from 'react-native';

import { PRESS_MS, pressTarget } from './press-feedback';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function Pressable({
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        reduceMotion.current = value;
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        reduceMotion.current = value;
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  function animate(pressed: boolean) {
    Animated.timing(scale, {
      toValue: pressTarget(reduceMotion.current, pressed),
      duration: reduceMotion.current ? 0 : PRESS_MS,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  }

  return (
    <RNPressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          animate(true);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(false);
        onPressOut?.(event);
      }}
      style={(state) => {
        const caller = typeof style === 'function' ? style(state) : style;
        return [caller, { transform: [{ scale }] }];
      }}
      {...rest}
    />
  );
}
