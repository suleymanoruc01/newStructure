import React from 'react';
import { Text, View } from 'react-native';

import { DAY_NAMES_TR } from '../../shared/availability/time-minutes';
import { clayChip } from '../ui/clay';
import { Pressable } from '../ui/Pressable';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DAY_SHORT_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

export function AvailabilityWeekGrid({
  selectedDay,
  markedDays,
  onSelect,
}: {
  selectedDay: number;
  markedDays: number[];
  onSelect: (day: number) => void;
}) {
  return (
    <View className="flex-row gap-1">
      {WEEK_ORDER.map((day) => {
        const active = selectedDay === day;
        const marked = markedDays.includes(day);
        return (
          <Pressable
            key={day}
            accessibilityLabel={DAY_NAMES_TR[day]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-[16px] py-2 ${
              active ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            style={clayChip(active)}
            onPress={() => onSelect(day)}
          >
            <Text
              className={`font-sans text-xs font-semibold ${
                active ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {DAY_SHORT_TR[day]}
            </Text>
            {marked ? (
              <View className="mt-1 h-1.5 w-1.5 rounded-full bg-action-accent" />
            ) : (
              <View className="mt-1 h-1.5" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
