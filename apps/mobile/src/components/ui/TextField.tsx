import React from 'react';
import { Text, TextInput, View } from 'react-native';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  error?: string | null;
  testID?: string;
  multiline?: boolean;
  numberOfLines?: number;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  testID,
  multiline,
  numberOfLines,
}: TextFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-text-medium">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className="rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 text-base text-text-high"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#83947A"
        testID={testID}
        value={value}
      />
      {error ? (
        <Text className="mt-1 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </View>
  );
}
