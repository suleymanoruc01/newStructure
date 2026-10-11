import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Pressable } from '../../../components/ui/Pressable';

const FALLBACK = '#EADCC5';

type AuthFrameProps = {
  title: string;
  subtitle?: string;
  testID?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function GlassBack({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(52, 74, 50, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          blurAmount={32}
          blurType="systemChromeMaterialLight"
          reducedTransparencyFallbackColor={FALLBACK}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: FALLBACK }]} />
      )}
      <Text className="font-sans text-lg font-semibold text-text-high">‹</Text>
    </Pressable>
  );
}

/** Brand lives in the type. Controls sit on the canvas — no painted header bar. */
export function AuthFrame({ title, subtitle, testID, children, footer }: AuthFrameProps) {
  const navigation = useNavigation();
  const { t } = useTranslation('common');
  const bottom = useSafeAreaInsets().bottom;
  const onBack = navigation.canGoBack() ? () => navigation.goBack() : undefined;

  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['top', 'left', 'right']} testID={testID}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-5"
          contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="h-14 justify-center">
            {onBack ? <GlassBack label={t('back')} onPress={onBack} /> : null}
          </View>
          <Text className="font-display text-[13px] font-bold tracking-wide text-text-medium">
            PartOn
          </Text>
          <Text className="font-display mt-3 text-[34px] font-bold leading-[40px] text-text-high">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-3 max-w-[34ch] font-sans text-base leading-6 text-text-medium">
              {subtitle}
            </Text>
          ) : null}
          <View className="mt-8 gap-3">{children}</View>
          {footer ? <View className="mt-auto pt-8">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
