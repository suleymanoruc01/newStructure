import React from 'react';
import { Text, View } from 'react-native';

import { clayChip } from './clay';
import { ClayCard } from './ClayCard';
import { Pressable } from './Pressable';

const WEEKDAY_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

export function MonthGrid({
  days,
  selected,
  monthKey,
  marks,
  softMarks,
  zone,
  onSelect,
}: {
  days: string[];
  selected: string;
  monthKey: string;
  marks: Record<string, number>;
  softMarks?: Record<string, boolean>;
  zone: string;
  onSelect: (day: string) => void;
}) {
  return (
    <ClayCard>
      <View className="mb-2 flex-row">
        {WEEKDAY_TR.map((label) => (
          <Text
            key={label}
            className="font-sans flex-1 text-center text-[11px] font-semibold text-text-medium"
          >
            {label}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const inMonth = day.startsWith(monthKey);
          const active = day === selected;
          const count = marks[day] ?? 0;
          const number = new Intl.DateTimeFormat('tr-TR', {
            timeZone: zone,
            day: 'numeric',
          }).format(new Date(`${day}T12:00:00.000Z`));
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`mb-1 items-center rounded-[16px] py-1.5 ${
                active ? 'bg-action-accent' : ''
              }`}
              style={[{ width: '14.28%' }, active ? clayChip(true) : undefined]}
              onPress={() => onSelect(day)}
            >
              <Text
                className={`font-display text-sm font-semibold ${
                  active
                    ? 'text-text-high'
                    : inMonth
                      ? 'text-text-high'
                      : 'text-text-low'
                }`}
              >
                {number}
              </Text>
              <View
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  count > 0
                    ? 'bg-action-primary'
                    : softMarks?.[day]
                      ? 'bg-action-secondary'
                      : 'bg-transparent'
                }`}
              />
            </Pressable>
          );
        })}
      </View>
    </ClayCard>
  );
}
