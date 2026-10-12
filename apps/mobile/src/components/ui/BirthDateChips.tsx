import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MONTH_SHORT_TR,
  birthDecade,
  birthDecades,
  civilIso,
  daysInMonth,
  parseCivil,
  yearsInDecade,
} from '../../shared/datetime/birth-date';
import { Pressable } from './Pressable';

export function BirthDateChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const { t } = useTranslation('worker');
  const parsed = parseCivil(value);
  const year = parsed?.year ?? birthDecades()[0] ?? 2000;
  const month = parsed?.month ?? 1;
  const day = parsed?.day ?? 1;
  const decade = birthDecade(year);
  const dayCount = daysInMonth(year, month);

  const write = (nextYear: number, nextMonth: number, nextDay: number) => {
    onChange(civilIso(nextYear, nextMonth, nextDay));
  };

  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text-high">
        {t('profile.birthDate')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {birthDecades().map((item) => (
          <Pressable
            key={item}
            className={`rounded-full px-3 py-2 ${
              decade === item ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => write(item, month, day)}
          >
            <Text
              className={`font-sans text-sm ${
                decade === item ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {item}’ler
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {yearsInDecade(decade).map((item) => (
          <Pressable
            key={item}
            className={`rounded-full px-3 py-2 ${
              parsed?.year === item ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => write(item, month, day)}
          >
            <Text
              className={`font-sans text-sm ${
                parsed?.year === item ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {MONTH_SHORT_TR.map((label, index) => {
          const item = index + 1;
          return (
            <Pressable
              key={label}
              className={`rounded-full px-3 py-2 ${
                parsed?.month === item ? 'bg-action-primary' : 'bg-surface-1'
              }`}
              onPress={() => write(year, item, day)}
            >
              <Text
                className={`font-sans text-sm ${
                  parsed?.month === item ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: dayCount }, (_, index) => {
          const item = index + 1;
          return (
            <Pressable
              key={item}
              className={`rounded-full px-3 py-2 ${
                parsed?.day === item ? 'bg-action-primary' : 'bg-surface-1'
              }`}
              onPress={() => write(year, month, item)}
            >
              <Text
                className={`font-sans text-sm ${
                  parsed?.day === item ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
