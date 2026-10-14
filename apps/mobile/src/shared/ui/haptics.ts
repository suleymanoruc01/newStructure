import { Platform, Vibration } from 'react-native';

export type HapticTone = 'light' | 'medium' | 'success' | 'error';

/**
 * Triggers subtle tactile impact feedback for user actions (shortlisting, applying, toggles)
 * Works reliably across both iOS and Android with graceful fallback.
 */
export function triggerHaptic(type: HapticTone = 'light'): void {
  try {
    switch (type) {
      case 'light':
        Vibration.vibrate(Platform.OS === 'android' ? 12 : 15);
        break;
      case 'medium':
        Vibration.vibrate(Platform.OS === 'android' ? 28 : 30);
        break;
      case 'success':
        Vibration.vibrate([0, 15, 60, 25]);
        break;
      case 'error':
        Vibration.vibrate([0, 35, 70, 40]);
        break;
    }
  } catch {
    // Graceful no-op if vibration permissions or hardware is unavailable
  }
}
