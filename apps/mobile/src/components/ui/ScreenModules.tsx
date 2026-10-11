import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Pressable } from './Pressable';
import { Screen } from './Screen';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const SHEET = '#FBF6EC';
const CHARCOAL = '#252823';
const MUSTARD = '#E2B83F';

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
  return (
    <View
      style={{
        backgroundColor: FOREST,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingTop: top + 16,
        paddingHorizontal: 20,
        paddingBottom: 48,
      }}
    >
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
  return (
    <View
      style={{
        marginTop: -36,
        flex: fill ? 1 : undefined,
        backgroundColor: SHEET,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 20,
        paddingTop: title ? 28 : 36,
        paddingBottom: 12,
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
    <Screen bleed dock={dock} scroll={scroll} testID={testID}>
      <HeroModule
        backLabel={t('back')}
        eyebrow={eyebrow}
        onBack={onBack}
        title={title}
      >
        {hero}
      </HeroModule>
      <SheetModule fill={!scroll} title={sheetTitle}>
        {children}
      </SheetModule>
    </Screen>
  );
}
