import React from 'react';
import { Text, TextInput, View } from 'react-native';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
  autoCapitalize,
  error,
  testID,
  multiline,
  numberOfLines,
}: TextFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 font-sans text-sm font-medium text-text-medium">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        className={
          multiline
            ? `min-h-32 rounded-lg border bg-surface-1 px-4 py-3 font-sans text-base text-text-high focus:border-action-primary ${error ? 'border-feedback-error' : 'border-surface-2'}`
            : `h-12 rounded-lg border bg-surface-1 px-4 font-sans text-base text-text-high focus:border-action-primary ${error ? 'border-feedback-error' : 'border-surface-2'}`
        }
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
        <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </View>
  );
}
