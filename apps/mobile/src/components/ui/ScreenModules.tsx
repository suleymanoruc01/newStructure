import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuroraWash } from './AuroraWash';
import { ClayChip } from './ClayChip';
import { clayChip, claySheet } from './clay';
import { Pressable } from './Pressable';
import { Screen } from './Screen';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
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
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: top + 16,
        paddingHorizontal: 20,
        paddingBottom: 52,
        overflow: 'hidden',
      }}
    >
      <AuroraWash variant="forest" />
      <View style={{ zIndex: 1 }}>
        {onBack ? (
          <View style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
            <ClayChip
              accessibilityLabel={backLabel}
              label={backLabel ?? ''}
              onPress={onBack}
            />
          </View>
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
            style={[
              clayChip(active),
              {
                flex: 1,
                alignItems: 'center',
                borderRadius: 16,
                paddingVertical: 8,
                backgroundColor: active ? MUSTARD : 'transparent',
              },
            ]}
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

export function SheetModule({ title, fill = true, children }: SheetProps) {
  const bottom = useSafeAreaInsets().bottom;
  return (
    <View
      style={{
        ...claySheet,
        marginTop: -40,
        flexGrow: 1,
        flex: fill ? 1 : undefined,
        paddingHorizontal: 20,
        paddingTop: title ? 28 : 36,
        paddingBottom: Math.max(bottom, 16),
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <AuroraWash variant="cream" />
      <View style={{ zIndex: 1, flexGrow: fill ? 1 : undefined }}>
        {title ? (
          <Text className="font-display mb-4 text-xl font-semibold text-text-high">
            {title}
          </Text>
        ) : null}
        {children}
      </View>
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
  eyebrow = 'PartOn',
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
