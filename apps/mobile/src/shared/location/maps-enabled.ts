import { Platform } from 'react-native';

// shortcut: keep equal to android/gradle.properties GOOGLE_MAPS_API_KEY; an empty key crashes MapView
const ANDROID_MAPS_KEY = '';

export function nativeMapsEnabled(): boolean {
  return Platform.OS !== 'android' || ANDROID_MAPS_KEY.length > 0;
}
