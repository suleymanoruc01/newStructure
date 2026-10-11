import { Alert } from 'react-native';

export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => finish(false) },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => finish(true),
        },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}
