import { Linking, Platform } from 'react-native';

export function openMapsAt(latitude: number, longitude: number, label?: string) {
  const q = label ? encodeURIComponent(label) : `${latitude},${longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`
      : `geo:${latitude},${longitude}?q=${q}`;
  return Linking.openURL(url);
}
