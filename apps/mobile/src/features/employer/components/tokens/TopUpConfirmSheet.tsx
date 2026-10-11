import React from 'react';
import { Modal, Text, View } from 'react-native';
import { Pressable } from '../../../../components/ui/Pressable';

import { Button } from '../../../../components/ui/Button';

type Props = {
  visible: boolean;
  amountLabel: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function TopUpConfirmSheet({
  visible,
  amountLabel,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onCancel}
      >
        <Pressable
          className="rounded-t-3xl bg-surface-2 p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="font-display text-xl font-bold text-text-high">{title}</Text>
          <Text className="font-sans mt-2 text-base text-text-medium">{body}</Text>
          <Text className="font-display mt-4 text-2xl font-bold text-text-high">
            {amountLabel}
          </Text>
          <View className="mt-6 gap-3">
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
