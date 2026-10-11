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
  secureTextEntry?: boolean;
  prefix?: string;
  autoFocus?: boolean;
  maxLength?: number;
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
  secureTextEntry,
  prefix,
  autoFocus,
  maxLength,
}: TextFieldProps) {
  const border = error ? 'border-feedback-error' : 'border-surface-2';
  return (
    <View className="mb-4">
      <Text className="mb-1 font-sans text-sm font-medium text-text-medium">{label}</Text>
      <View
        className={
          multiline
            ? `min-h-32 rounded-lg border bg-surface-1 px-4 py-3 ${border}`
            : `h-12 flex-row items-center rounded-lg border bg-surface-1 ${border}`
        }
      >
        {prefix ? (
          <Text className="pl-4 font-sans text-base font-semibold text-text-high">{prefix}</Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          className={
            multiline
              ? 'min-h-28 flex-1 font-sans text-base text-text-high'
              : `h-12 flex-1 font-sans text-base text-text-high ${prefix ? 'px-3' : 'px-4'}`
          }
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#83947A"
          secureTextEntry={secureTextEntry}
          testID={testID}
          value={value}
        />
      </View>
      {error ? (
        <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </View>
  );
}
