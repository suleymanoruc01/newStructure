import React from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraWash } from '../../../../components/ui/AuroraWash';
import { Button } from '../../../../components/ui/Button';
import { claySheet } from '../../../../components/ui/clay';
import { Pressable } from '../../../../components/ui/Pressable';

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
  const bottom = useSafeAreaInsets().bottom;
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
        pressScale={false}
      >
        <Pressable
          className="overflow-hidden p-6"
          onPress={(event) => event.stopPropagation()}
          pressScale={false}
          style={[claySheet, { paddingBottom: Math.max(bottom, 24) }]}
        >
          <AuroraWash variant="cream" />
          <View pointerEvents="box-none" style={{ zIndex: 1 }}>
            <Text className="font-display text-xl font-bold text-text-high">
              {title}
            </Text>
            <Text className="font-sans mt-2 text-base text-text-medium">{body}</Text>
            <Text className="font-display mt-4 text-2xl font-bold text-text-high">
              {amountLabel}
            </Text>
            <View className="mt-6 gap-3">
              <Button label={confirmLabel} onPress={onConfirm} />
              <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
