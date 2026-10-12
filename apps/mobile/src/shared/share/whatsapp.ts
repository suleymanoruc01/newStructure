import { Linking } from 'react-native';

export function shareViaWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return Linking.openURL(url);
}
