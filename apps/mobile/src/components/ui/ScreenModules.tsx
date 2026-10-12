import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Pressable } from './Pressable';
import { Screen } from './Screen';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const SHEET = '#FBF6EC';
const CHARCOAL = '#252823';
const MUSTARD = '#E2B83F';
const ORANGE = '#E97A3D';
const LEAF = '#79A94B';

function useSolidWash(): boolean {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) {
        setSolid(value);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setSolid,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return solid;
}

function Glow({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style: ViewStyle;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

type HeroProps = {
  eyebrow: string;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  children?: React.ReactNode;
};

export function HeroModule({
  eyebrow,
  title,
  onBack,
  backLabel,
  children,
}: HeroProps) {
  const top = useSafeAreaInsets().top;
  const solid = useSolidWash();
  return (
    <View
      style={{
        backgroundColor: FOREST,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: top + 16,
        paddingHorizontal: 20,
        paddingBottom: 52,
        overflow: 'hidden',
      }}
    >
      {solid ? null : (
        <>
          <Glow color={ORANGE} size={220} style={{ top: -70, right: -50, opacity: 0.55 }} />
          <Glow color={MUSTARD} size={160} style={{ top: 36, right: 28, opacity: 0.28 }} />
          <Glow color={LEAF} size={200} style={{ bottom: -80, left: -40, opacity: 0.4 }} />
          <Glow color={CREAM} size={120} style={{ bottom: 8, right: -20, opacity: 0.16 }} />
          <BlurView
            blurAmount={48}
            blurType="dark"
            pointerEvents="none"
            reducedTransparencyFallbackColor={FOREST}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      {onBack ? (
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          onPress={onBack}
          style={{ marginBottom: 12, alignSelf: 'flex-start' }}
        >
          <Text className="font-sans" style={{ color: CREAM, fontSize: 15, fontWeight: '600' }}>
            {backLabel}
          </Text>
        </Pressable>
      ) : null}
      {eyebrow ? (
        <Text
          className="font-sans"
          style={{ color: CREAM, fontSize: 12, fontWeight: '600' }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        className="font-display"
        style={{ color: CREAM, fontSize: 32, fontWeight: '700', marginTop: 6 }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

type DayStripProps = {
  days: readonly string[];
  selected: string;
  zone: string;
  onSelect: (day: string) => void;
};

export function DayStrip({ days, selected, zone, onSelect }: DayStripProps) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 20, gap: 6 }}>
      {days.map((day) => {
        const active = day === selected;
        const date = new Date(`${day}T12:00:00.000Z`);
        const number = new Intl.DateTimeFormat('tr-TR', {
          timeZone: zone,
          day: 'numeric',
        }).format(date);
        const letter = new Intl.DateTimeFormat('tr-TR', {
          timeZone: zone,
          weekday: 'narrow',
        }).format(date);
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(day)}
            style={{
              flex: 1,
              alignItems: 'center',
              borderRadius: 14,
              paddingVertical: 8,
              backgroundColor: active ? MUSTARD : 'transparent',
            }}
          >
            <Text
              className="font-display"
              style={{
                color: active ? CHARCOAL : CREAM,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              {number}
            </Text>
            <Text
              className="font-sans"
              style={{
                color: active ? CHARCOAL : CREAM,
                fontSize: 11,
                marginTop: 2,
              }}
            >
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SheetProps = {
  title?: string;
  fill?: boolean;
  children: React.ReactNode;
};

export function SheetModule({ title, fill = false, children }: SheetProps) {
  const bottom = useSafeAreaInsets().bottom;
  return (
    <View
      style={{
        marginTop: -40,
        flexGrow: 1,
        flex: fill ? 1 : undefined,
        backgroundColor: SHEET,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: CHARCOAL,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        paddingHorizontal: 20,
        paddingTop: title ? 28 : 36,
        paddingBottom: Math.max(bottom, 16),
        zIndex: 1,
      }}
    >
      {title ? (
        <Text className="font-display mb-4 text-xl font-semibold text-text-high">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

type ModulePageProps = {
  title: string;
  eyebrow?: string;
  testID?: string;
  dock?: boolean;
  scroll?: boolean;
  back?: 'auto' | 'off' | (() => void);
  sheetTitle?: string;
  hero?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
};

export function ModulePage({
  title,
  eyebrow = '',
  testID,
  dock = false,
  scroll = true,
  back = 'auto',
  sheetTitle,
  hero,
  refreshing,
  onRefresh,
  children,
}: ModulePageProps) {
  const navigation = useNavigation();
  const { t } = useTranslation('common');
  const onBack =
    typeof back === 'function'
      ? back
      : back === 'auto' && navigation.canGoBack()
        ? () => navigation.goBack()
        : undefined;

  return (
    <Screen
      bleed
      dock={dock}
      onRefresh={onRefresh}
      refreshing={refreshing}
      scroll={scroll}
      testID={testID}
    >
      <HeroModule
        backLabel={t('back')}
        eyebrow={eyebrow}
        onBack={onBack}
        title={title}
      >
        {hero}
      </HeroModule>
      <SheetModule fill title={sheetTitle}>
        {children}
      </SheetModule>
    </Screen>
  );
}
