import React from 'react';
import { StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

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
  /** Soft field on the canvas. Auth password uses this. */
  inset?: boolean;
  shape?: 'rect' | 'capsule';
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
  inset = false,
  shape = 'rect',
}: TextFieldProps) {
  const capsule = shape === 'capsule';
  const soft = inset || capsule;
  const radius = capsule ? 'rounded-full' : inset ? 'rounded-[22px]' : 'rounded-lg';
  const border = error
    ? 'border border-feedback-error'
    : soft
      ? 'border border-transparent'
      : 'border border-surface-2';
  const clay: ViewStyle | undefined = capsule
    ? {
        shadowColor: '#252823',
        shadowOffset: { width: 2, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
        elevation: 3,
        borderTopWidth: 2,
        borderTopColor: 'rgba(251, 246, 236, 0.9)',
        borderBottomWidth: 4,
        borderBottomColor: '#DDD4C7',
      }
    : undefined;
  return (
    <View className="mb-1">
      <Text className="mb-2 font-sans text-sm font-medium text-text-medium">{label}</Text>
      <View
        style={clay}
        className={
          multiline
            ? `min-h-32 bg-surface-1 px-4 py-3 ${radius} ${border}`
            : `${soft ? 'h-14' : 'h-12'} flex-row items-center bg-surface-1 ${
                capsule ? 'px-2' : ''
              } ${radius} ${border}`
        }
      >
        {prefix && capsule ? (
          <View className="h-10 items-center justify-center rounded-full bg-action-secondary px-3">
            <Text className="font-sans text-base font-semibold text-text-on">{prefix}</Text>
          </View>
        ) : prefix ? (
          <Text className="pl-4 font-sans text-base font-semibold text-text-high">{prefix}</Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoCorrect={secureTextEntry ? false : undefined}
          autoFocus={autoFocus}
          className={
            secureTextEntry
              ? undefined
              : multiline
              ? 'min-h-28 flex-1 font-sans text-base text-text-high'
              : `${soft ? 'h-14 font-display text-lg' : 'h-12 font-sans text-base'} flex-1 text-text-high ${
                  prefix ? 'px-3' : 'px-4'
                }`
          }
          clearTextOnFocus={false}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#83947A"
          secureTextEntry={secureTextEntry}
          spellCheck={secureTextEntry ? false : undefined}
          style={secureTextEntry ? styles.secure : undefined}
          testID={testID}
          textContentType={secureTextEntry ? 'password' : undefined}
          value={value}
        />
      </View>
      {error ? (
        <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  secure: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#252823',
  },
});
