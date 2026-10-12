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
import { ClayChip } from './ClayChip';

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
          <ClayChip
            key={item}
            label={`${item}’ler`}
            onPress={() => write(item, month, day)}
            selected={decade === item}
          />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {yearsInDecade(decade).map((item) => (
          <ClayChip
            key={item}
            label={String(item)}
            onPress={() => write(item, month, day)}
            selected={parsed?.year === item}
          />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {MONTH_SHORT_TR.map((label, index) => {
          const item = index + 1;
          return (
            <ClayChip
              key={label}
              label={label}
              onPress={() => write(year, item, day)}
              selected={parsed?.month === item}
            />
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: dayCount }, (_, index) => {
          const item = index + 1;
          return (
            <ClayChip
              key={item}
              label={String(item)}
              onPress={() => write(year, month, item)}
              selected={parsed?.day === item}
            />
          );
        })}
      </View>
    </View>
  );
}
