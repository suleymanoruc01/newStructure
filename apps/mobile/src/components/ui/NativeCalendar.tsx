import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatTr,
  istanbulDayKey,
  monthGridKeys,
  shiftMonthKey,
  useDisplayTimeZone,
} from '../../shared/datetime/istanbul';
import { triggerHaptic } from '../../shared/ui/haptics';
import { clayCard, clayChip } from './clay';
import { ClayCard } from './ClayCard';
import { Pressable } from './Pressable';

export const WEEKDAY_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

export interface CalendarMark {
  count?: number;
  dotColor?: string;
  label?: string;
}

export interface NativeCalendarProps {
  /** Mode: 'single' for one date, 'range' for a start & end date */
  mode?: 'single' | 'range';
  /** Selected date in 'YYYY-MM-DD' format (single mode) */
  selectedDate?: string | null;
  /** Selected date range (range mode) */
  selectedRange?: { start?: string | null; end?: string | null };
  /** Callback on single date selection */
  onSelectDate?: (dateKey: string) => void;
  /** Callback on range selection */
  onSelectRange?: (range: { start: string; end: string }) => void;
  /** Earliest selectable date 'YYYY-MM-DD' */
  minDate?: string;
  /** Latest selectable date 'YYYY-MM-DD' */
  maxDate?: string;
  /** Event counts or detailed mark objects keyed by 'YYYY-MM-DD' */
  marks?: Record<string, number | CalendarMark>;
  /** Soft availability marks keyed by 'YYYY-MM-DD' */
  softMarks?: Record<string, boolean>;
  /** Starting month anchor 'YYYY-MM-DD' (defaults to today or selectedDate) */
  monthKey?: string;
  /** Fired when month view changes */
  onMonthChange?: (monthKey: string) => void;
  /** Display timezone override */
  zone?: string;
  /** Whether to allow tapping the header to jump to month/year */
  allowMonthYearPicker?: boolean;
  /** Test identifier */
  testID?: string;
}

export function NativeCalendar({
  mode = 'single',
  selectedDate,
  selectedRange,
  onSelectDate,
  onSelectRange,
  minDate,
  maxDate,
  marks = {},
  softMarks = {},
  monthKey: controlledMonthKey,
  onMonthChange,
  zone: customZone,
  allowMonthYearPicker = true,
  testID,
}: NativeCalendarProps) {
  const { t } = useTranslation(['common', 'worker']);
  const defaultZone = useDisplayTimeZone();
  const zone = customZone ?? defaultZone;

  const today = istanbulDayKey(new Date(), zone);
  const initialAnchor = controlledMonthKey ?? selectedDate ?? selectedRange?.start ?? today;

  const [activeDayKey, setActiveDayKey] = useState(initialAnchor);
  const [showYearMonthPicker, setShowYearMonthPicker] = useState(false);

  // Derived current month key: "YYYY-MM"
  const currentMonthKey = (controlledMonthKey ?? activeDayKey).slice(0, 7);

  const [yearNum, monthNum] = useMemo(() => {
    const parts = currentMonthKey.split('-').map(Number);
    return [parts[0] ?? 2026, parts[1] ?? 10];
  }, [currentMonthKey]);

  const gridDays = useMemo(() => {
    return monthGridKeys(new Date(`${currentMonthKey}-01T12:00:00.000Z`), zone);
  }, [currentMonthKey, zone]);

  const monthTitle = useMemo(() => {
    return formatTr(`${currentMonthKey}-01T12:00:00.000Z`, zone, {
      month: 'long',
      year: 'numeric',
    });
  }, [currentMonthKey, zone]);

  const changeMonth = (delta: number) => {
    triggerHaptic('light');
    const nextKey = shiftMonthKey(`${currentMonthKey}-01`, delta, zone);
    setActiveDayKey(nextKey);
    onMonthChange?.(nextKey.slice(0, 7));
  };

  const jumpToToday = () => {
    triggerHaptic('light');
    setActiveDayKey(today);
    onMonthChange?.(today.slice(0, 7));
    if (mode === 'single') {
      onSelectDate?.(today);
    }
  };

  const jumpToYearMonth = (targetYear: number, targetMonth: number) => {
    triggerHaptic('light');
    const mm = String(targetMonth).padStart(2, '0');
    const nextKey = `${targetYear}-${mm}-01`;
    setActiveDayKey(nextKey);
    onMonthChange?.(`${targetYear}-${mm}`);
    setShowYearMonthPicker(false);
  };

  const handleDayPress = (day: string) => {
    if (minDate && day < minDate) return;
    if (maxDate && day > maxDate) return;

    triggerHaptic('light');

    if (mode === 'single') {
      onSelectDate?.(day);
      setActiveDayKey(day);
      return;
    }

    if (mode === 'range') {
      const start = selectedRange?.start;
      const end = selectedRange?.end;

      if (!start || (start && end)) {
        // Start new range
        onSelectRange?.({ start: day, end: '' });
      } else if (start && !end) {
        if (day < start) {
          // Reset with earlier start
          onSelectRange?.({ start: day, end: '' });
        } else {
          onSelectRange?.({ start, end: day });
        }
      }
    }
  };

  // Generate decade/year choices for picker
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = yearNum - 3; y <= yearNum + 3; y++) {
      list.push(y);
    }
    return list;
  }, [yearNum]);

  return (
    <ClayCard testID={testID}>
      {/* Calendar Header with Navigation */}
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Önceki ay"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-1"
          style={clayChip(false)}
          onPress={() => changeMonth(-1)}
          testID="calendar.prevMonth"
        >
          <Text className="font-sans text-base font-bold text-text-high">‹</Text>
        </Pressable>

        <Pressable
          accessibilityLabel={`Ay seçimi: ${monthTitle}`}
          accessibilityRole="button"
          disabled={!allowMonthYearPicker}
          className="flex-row items-center gap-1.5 rounded-full bg-surface-1 px-4 py-2"
          style={clayChip(showYearMonthPicker)}
          onPress={() => {
            triggerHaptic('light');
            setShowYearMonthPicker((v) => !v);
          }}
          testID="calendar.monthHeader"
        >
          <Text className="font-display text-base font-semibold text-text-high">
            {monthTitle}
          </Text>
          {allowMonthYearPicker ? (
            <Text className="font-sans text-xs text-text-medium">
              {showYearMonthPicker ? '▲' : '▼'}
            </Text>
          ) : null}
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            accessibilityLabel="Bugün"
            accessibilityRole="button"
            className="rounded-full bg-surface-1 px-2.5 py-1.5"
            style={clayChip(activeDayKey === today)}
            onPress={jumpToToday}
            testID="calendar.todayBtn"
          >
            <Text className="font-sans text-xs font-semibold text-text-high">
              {t('common:calendarToday', { defaultValue: 'Bugün' })}
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Sonraki ay"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-1"
            style={clayChip(false)}
            onPress={() => changeMonth(1)}
            testID="calendar.nextMonth"
          >
            <Text className="font-sans text-base font-bold text-text-high">›</Text>
          </Pressable>
        </View>
      </View>

      {/* Year & Month Quick Jumper Panel */}
      {showYearMonthPicker ? (
        <View className="mb-4 rounded-2xl bg-surface-base p-3" style={clayCard}>
          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
            Yıl
          </Text>
          <View className="mb-3 flex-row flex-wrap gap-1.5">
            {yearOptions.map((y) => (
              <Pressable
                key={y}
                accessibilityRole="button"
                className={`rounded-full px-3 py-1.5 ${
                  y === yearNum ? 'bg-action-primary' : 'bg-surface-1'
                }`}
                style={clayChip(y === yearNum)}
                onPress={() => jumpToYearMonth(y, monthNum)}
              >
                <Text
                  className={`font-sans text-xs font-semibold ${
                    y === yearNum ? 'text-text-on' : 'text-text-high'
                  }`}
                >
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
            Ay
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {MONTH_NAMES_TR.map((mName, idx) => {
              const mVal = idx + 1;
              const isSelected = mVal === monthNum;
              return (
                <Pressable
                  key={mName}
                  accessibilityRole="button"
                  className={`rounded-full px-2.5 py-1 ${
                    isSelected ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  style={clayChip(isSelected)}
                  onPress={() => jumpToYearMonth(yearNum, mVal)}
                >
                  <Text
                    className={`font-sans text-xs ${
                      isSelected ? 'font-semibold text-text-on' : 'text-text-high'
                    }`}
                  >
                    {mName.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Weekday Column Headers */}
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

      {/* Days Grid */}
      <View className="flex-row flex-wrap">
        {gridDays.map((day) => {
          const inMonth = day.startsWith(currentMonthKey);
          const isToday = day === today;
          const isPastMin = minDate ? day < minDate : false;
          const isFutureMax = maxDate ? day > maxDate : false;
          const isDisabled = isPastMin || isFutureMax;

          // Selection logic
          let isSelected = false;
          let isInRange = false;
          let isRangeStart = false;
          let isRangeEnd = false;

          if (mode === 'single') {
            isSelected = day === (selectedDate ?? activeDayKey);
          } else if (mode === 'range') {
            const start = selectedRange?.start;
            const end = selectedRange?.end;

            isRangeStart = Boolean(start && day === start);
            isRangeEnd = Boolean(end && day === end);
            isSelected = isRangeStart || isRangeEnd;
            isInRange = Boolean(start && end && day > start && day < end);
          }

          // Marks calculation
          const rawMark = marks[day];
          let markCount = 0;
          let dotColorClass = 'bg-action-primary';

          if (typeof rawMark === 'number') {
            markCount = rawMark;
          } else if (rawMark && typeof rawMark === 'object') {
            markCount = rawMark.count ?? 1;
            if (rawMark.dotColor) {
              dotColorClass = rawMark.dotColor;
            }
          }

          const hasSoftMark = Boolean(softMarks[day]);
          const dayNum = formatTr(`${day}T12:00:00.000Z`, zone, { day: 'numeric' });

          // Background styles
          let containerBg = 'bg-transparent';
          if (isSelected) {
            containerBg = 'bg-action-primary';
          } else if (isInRange) {
            containerBg = 'bg-accent-mustard/20';
          }

          let textColor = 'text-text-high';
          if (isSelected) {
            textColor = 'text-text-on';
          } else if (isDisabled) {
            textColor = 'text-text-low opacity-30';
          } else if (!inMonth) {
            textColor = 'text-text-low opacity-60';
          }

          return (
            <View
              key={day}
              className={`mb-1 items-center justify-center ${
                isInRange ? 'bg-accent-mustard/15' : ''
              } ${isRangeStart ? 'rounded-l-[16px]' : ''} ${
                isRangeEnd ? 'rounded-r-[16px]' : ''
              }`}
              style={{ width: '14.28%' }}
            >
              <Pressable
                accessibilityLabel={`${dayNum} ${monthTitle}${
                  markCount > 0 ? `, ${markCount} etkinlik` : ''
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                disabled={isDisabled}
                className={`h-11 w-11 items-center justify-center rounded-[16px] ${containerBg} ${
                  isToday && !isSelected ? 'border border-action-primary/60' : ''
                }`}
                style={isSelected ? clayChip(true) : undefined}
                onPress={() => handleDayPress(day)}
                testID={`calendar.day.${day}`}
              >
                <Text className={`font-display text-sm font-semibold ${textColor}`}>
                  {dayNum}
                </Text>

                {/* Event indicators */}
                <View className="mt-0.5 h-1.5 flex-row items-center gap-0.5">
                  {markCount > 0 ? (
                    <View
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-text-on' : dotColorClass
                      }`}
                    />
                  ) : hasSoftMark ? (
                    <View
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-text-on' : 'bg-action-secondary'
                      }`}
                    />
                  ) : null}
                  {markCount > 1 ? (
                    <View
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-text-on' : 'bg-accent-mustard'
                      }`}
                    />
                  ) : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ClayCard>
  );
}
