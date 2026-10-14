import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  addMinutesToTime,
  computeRangeDuration,
  parseTimeToMinute,
} from '../../shared/availability/time-minutes';
import { triggerHaptic } from '../../shared/ui/haptics';
import { ClayCard } from './ClayCard';
import { clayCard, clayChip } from './clay';
import { NativeTimePicker } from './NativeTimePicker';
import { Pressable } from './Pressable';
import { StatusBadge } from './StatusBadge';

export interface TimeRangeValue {
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
  durationMinutes: number;
  durationFormatted: string;
}

export interface NativeTimeRangePickerProps {
  label?: string;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  crossesMidnight?: boolean;
  onChange: (value: TimeRangeValue) => void;
  /** Quick duration presets in hours (e.g. [4, 6, 8, 10, 12]) */
  durationPresets?: number[];
  testID?: string;
  error?: string | null;
}

const DEFAULT_DURATION_PRESETS = [4, 6, 8, 10, 12] as const;

export function NativeTimeRangePicker({
  label = 'Vardiya Saatleri',
  startTime,
  endTime,
  crossesMidnight: controlledCrossesMidnight,
  onChange,
  durationPresets = DEFAULT_DURATION_PRESETS as unknown as number[],
  testID,
  error,
}: NativeTimeRangePickerProps) {
  const { t } = useTranslation(['common', 'worker', 'employer']);

  const startMin = useMemo(() => {
    try {
      return parseTimeToMinute(startTime);
    } catch {
      return 9 * 60;
    }
  }, [startTime]);

  const endMin = useMemo(() => {
    try {
      return parseTimeToMinute(endTime);
    } catch {
      return 17 * 60;
    }
  }, [endTime]);

  // Overnight is automatically true if endMinute <= startMinute, or controlled
  const isOvernight = controlledCrossesMidnight ?? endMin <= startMin;

  const { durationMinutes, formatted: durationFormatted } = useMemo(() => {
    return computeRangeDuration(startMin, endMin, isOvernight);
  }, [startMin, endMin, isOvernight]);

  const handleStartChange = (nextStart: string) => {
    try {
      const nextStartMin = parseTimeToMinute(nextStart);
      const nextIsOvernight = controlledCrossesMidnight ?? endMin <= nextStartMin;
      const { durationMinutes: dMin, formatted } = computeRangeDuration(
        nextStartMin,
        endMin,
        nextIsOvernight,
      );
      onChange({
        startTime: nextStart,
        endTime,
        crossesMidnight: nextIsOvernight,
        durationMinutes: dMin,
        durationFormatted: formatted,
      });
    } catch {
      // Fallback
    }
  };

  const handleEndChange = (nextEnd: string) => {
    try {
      const nextEndMin = parseTimeToMinute(nextEnd);
      const nextIsOvernight = controlledCrossesMidnight ?? nextEndMin <= startMin;
      const { durationMinutes: dMin, formatted } = computeRangeDuration(
        startMin,
        nextEndMin,
        nextIsOvernight,
      );
      onChange({
        startTime,
        endTime: nextEnd,
        crossesMidnight: nextIsOvernight,
        durationMinutes: dMin,
        durationFormatted: formatted,
      });
    } catch {
      // Fallback
    }
  };

  const applyPresetDuration = (hours: number) => {
    triggerHaptic('light');
    const nextEnd = addMinutesToTime(startTime, hours * 60);
    const nextEndMin = parseTimeToMinute(nextEnd);
    const nextIsOvernight = nextEndMin <= startMin;
    const { durationMinutes: dMin, formatted } = computeRangeDuration(
      startMin,
      nextEndMin,
      nextIsOvernight,
    );
    onChange({
      startTime,
      endTime: nextEnd,
      crossesMidnight: nextIsOvernight,
      durationMinutes: dMin,
      durationFormatted: formatted,
    });
  };

  const toggleCrossesMidnight = () => {
    triggerHaptic('light');
    const nextOvernight = !isOvernight;
    const { durationMinutes: dMin, formatted } = computeRangeDuration(
      startMin,
      endMin,
      nextOvernight,
    );
    onChange({
      startTime,
      endTime,
      crossesMidnight: nextOvernight,
      durationMinutes: dMin,
      durationFormatted: formatted,
    });
  };

  // 24-hour visual progress bar calculations
  // Total minutes in 24 hours = 1440
  const startPercent = Math.max(0, Math.min(100, (startMin / 1440) * 100));
  const spanPercent = Math.max(0, Math.min(100, (durationMinutes / 1440) * 100));

  return (
    <ClayCard testID={testID}>
      {/* Header with Title and Duration Badge */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-display text-base font-bold text-text-high">{label}</Text>

        <View className="flex-row items-center gap-1.5">
          <StatusBadge
            label={durationFormatted}
            tone={durationMinutes > 600 ? 'warn' : 'strong'}
          />
          {isOvernight ? (
            <StatusBadge label="Gece" tone="warn" />
          ) : null}
        </View>
      </View>

      {/* 24-Hour Timeline Bar */}
      <View className="mb-4">
        {/* Day/Night Labels */}
        <View className="mb-1 flex-row justify-between">
          <Text className="font-sans text-[10px] text-text-low">00:00 (Gece)</Text>
          <Text className="font-sans text-[10px] text-text-low">06:00</Text>
          <Text className="font-sans text-[10px] text-text-low">12:00 (Öğle)</Text>
          <Text className="font-sans text-[10px] text-text-low">18:00</Text>
          <Text className="font-sans text-[10px] text-text-low">24:00</Text>
        </View>

        {/* Track */}
        <View className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
          {!isOvernight ? (
            // Single contiguous block
            <View
              className="h-full rounded-full bg-action-primary"
              style={{
                left: `${startPercent}%`,
                width: `${spanPercent}%`,
                position: 'absolute',
              }}
            />
          ) : (
            // Wraps around midnight (two blocks)
            <>
              {/* Part 1: from start to 24:00 */}
              <View
                className="h-full rounded-r-none rounded-l-full bg-action-primary"
                style={{
                  left: `${startPercent}%`,
                  width: `${100 - startPercent}%`,
                  position: 'absolute',
                }}
              />
              {/* Part 2: from 00:00 to end */}
              <View
                className="h-full rounded-l-none rounded-r-full bg-action-primary"
                style={{
                  left: '0%',
                  width: `${Math.min(100, (endMin / 1440) * 100)}%`,
                  position: 'absolute',
                }}
              />
            </>
          )}
        </View>
      </View>

      {/* Side-by-side Start & End Pickers */}
      <View className="mb-3 flex-row gap-2.5">
        <View className="flex-1">
          <NativeTimePicker
            label="Başlangıç"
            value={startTime}
            onChange={handleStartChange}
            presentation="sheet"
            testID="range.start"
          />
        </View>

        <View className="flex-1">
          <NativeTimePicker
            label="Bitiş"
            value={endTime}
            onChange={handleEndChange}
            presentation="sheet"
            testID="range.end"
          />
        </View>
      </View>

      {/* Preset Duration Buttons */}
      <View className="mb-3">
        <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
          Hızlı Vardiya Süresi
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {durationPresets.map((h) => {
            const isMatch = durationMinutes === h * 60;
            return (
              <Pressable
                key={`dur-${h}`}
                accessibilityRole="button"
                className={`rounded-full px-3 py-1.5 ${
                  isMatch ? 'bg-action-primary' : 'bg-surface-1'
                }`}
                style={clayChip(isMatch)}
                onPress={() => applyPresetDuration(h)}
                testID={`range.preset.${h}`}
              >
                <Text
                  className={`font-sans text-xs font-semibold ${
                    isMatch ? 'text-text-on' : 'text-text-high'
                  }`}
                >
                  {h} Saat
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Crosses Midnight Notice & Switch */}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isOvernight }}
        className="flex-row items-center justify-between rounded-[20px] bg-surface-base px-3.5 py-2.5"
        style={clayCard}
        onPress={toggleCrossesMidnight}
        testID="range.overnightSwitch"
      >
        <View className="flex-row items-center gap-2">
          <Text className="font-sans text-sm">🌙</Text>
          <View>
            <Text className="font-sans text-sm font-semibold text-text-high">
              Gece Vardiyası
            </Text>
            <Text className="font-sans text-xs text-text-low">
              {isOvernight
                ? 'Ertesi güne sarkar'
                : 'Aynı takvim gününde tamamlanır'}
            </Text>
          </View>
        </View>

        <StatusBadge
          label={isOvernight ? 'Evet' : 'Hayır'}
          tone={isOvernight ? 'warn' : 'neutral'}
        />
      </Pressable>

      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ClayCard>
  );
}
