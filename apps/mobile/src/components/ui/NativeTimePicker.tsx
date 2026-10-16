import React, { useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatMinuteOfDay,
  parseTimeToMinute,
} from '../../shared/availability/time-minutes';
import { triggerHaptic } from '../../shared/ui/haptics';
import { Button } from './Button';
import { ClayCard } from './ClayCard';
import { clayCard, clayChip, claySheet } from './clay';
import { Pressable } from './Pressable';
import { TimerPicker } from 'react-native-timer-picker';

export interface NativeTimePickerProps {
  label?: string;
  value: string; // 'HH:mm'
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  presentation?: 'sheet' | 'inline';
  testID?: string;
  error?: string | null;
  triggerActionLabel?: string;
  mode?: 'wheel' | 'keys';
}

const DEFAULT_HOUR_PRESETS = [6, 8, 9, 10, 12, 14, 16, 18, 20, 22] as const;
const MINUTE_PRESETS = [0, 15, 30, 45] as const;

export function NativeTimePicker({
  label = 'Saat Seçin',
  value = '09:00',
  onChange,
  minTime,
  maxTime,
  minuteInterval = 5,
  presentation = 'sheet',
  testID,
  error,
  triggerActionLabel = 'Değiştir',
  mode = 'wheel',
}: NativeTimePickerProps) {
  const { t } = useTranslation(['common', 'worker']);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerView, setPickerView] = useState<'wheel' | 'keys'>(mode);
  const [activeSegment, setActiveSegment] = useState<'hour' | 'minute'>('hour');

  // Parse hour & minute
  const parsed = useMemo(() => {
    try {
      const total = parseTimeToMinute(value);
      return {
        hour: Math.floor(total / 60),
        minute: total % 60,
      };
    } catch {
      return { hour: 9, minute: 0 };
    }
  }, [value]);

  // Draft state while sheet is open
  const [draftHour, setDraftHour] = useState(parsed.hour);
  const [draftMinute, setDraftMinute] = useState(parsed.minute);

  const activeH = presentation === 'sheet' && modalOpen ? draftHour : parsed.hour;
  const activeM = presentation === 'sheet' && modalOpen ? draftMinute : parsed.minute;

  const currentFormatted = `${String(activeH).padStart(2, '0')}:${String(
    activeM,
  ).padStart(2, '0')}`;

  const setHour = (h: number) => {
    triggerHaptic('light');
    const clampedH = Math.max(0, Math.min(23, h));
    if (presentation === 'sheet' && modalOpen) {
      setDraftHour(clampedH);
    } else {
      onChange(
        `${String(clampedH).padStart(2, '0')}:${String(activeM).padStart(2, '0')}`,
      );
    }
  };

  const setMinute = (m: number) => {
    triggerHaptic('light');
    const clampedM = Math.max(0, Math.min(59, m));
    if (presentation === 'sheet' && modalOpen) {
      setDraftMinute(clampedM);
    } else {
      onChange(
        `${String(activeH).padStart(2, '0')}:${String(clampedM).padStart(2, '0')}`,
      );
    }
  };

  const stepHour = (delta: number) => {
    const nextH = (activeH + delta + 24) % 24;
    setHour(nextH);
  };

  const stepMinute = (delta: number) => {
    const nextM = (activeM + delta + 60) % 60;
    setMinute(nextM);
  };

  const handleOpenSheet = () => {
    triggerHaptic('light');
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setModalOpen(true);
  };

  const handleConfirm = () => {
    triggerHaptic('light');
    onChange(
      `${String(draftHour).padStart(2, '0')}:${String(draftMinute).padStart(2, '0')}`,
    );
    setModalOpen(false);
  };

  const handleCancel = () => {
    triggerHaptic('light');
    setModalOpen(false);
  };

  // Generate minutes list according to interval
  const minutesList = useMemo(() => {
    const list: number[] = [];
    for (let m = 0; m < 60; m += minuteInterval) {
      list.push(m);
    }
    return list;
  }, [minuteInterval]);

  const renderPickerBody = () => (
    <View className="gap-4">
      {/* Mode Switcher */}
      <View className="flex-row items-center justify-center gap-2">
        <Pressable
          accessibilityRole="button"
          className={`rounded-full px-3.5 py-1.5 ${
            pickerView === 'wheel' ? 'bg-action-primary' : 'bg-surface-1'
          }`}
          style={clayChip(pickerView === 'wheel')}
          onPress={() => {
            triggerHaptic('light');
            setPickerView('wheel');
          }}
          testID={`${testID ?? 'time-picker'}.modeWheel`}
        >
          <Text
            className={`font-sans text-xs font-semibold ${
              pickerView === 'wheel' ? 'text-text-on' : 'text-text-high'
            }`}
          >
            🎡 24-Saat Çark
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className={`rounded-full px-3.5 py-1.5 ${
            pickerView === 'keys' ? 'bg-action-primary' : 'bg-surface-1'
          }`}
          style={clayChip(pickerView === 'keys')}
          onPress={() => {
            triggerHaptic('light');
            setPickerView('keys');
          }}
          testID={`${testID ?? 'time-picker'}.modeKeys`}
        >
          <Text
            className={`font-sans text-xs font-semibold ${
              pickerView === 'keys' ? 'text-text-on' : 'text-text-high'
            }`}
          >
            🔢 Tuşlar & Kadran
          </Text>
        </Pressable>
      </View>

      {pickerView === 'wheel' ? (
        <View
          className="items-center justify-center rounded-3xl bg-surface-1 py-4"
          style={clayCard}
          testID={`${testID ?? 'time-picker'}.wheelContainer`}
        >
          <TimerPicker
            padHoursWithZero
            padMinutesWithZero
            hideSeconds
            hideDays
            use12HourPicker={false}
            hourLimit={{ max: 23, min: 0 }}
            minuteInterval={minuteInterval}
            initialValue={{ hours: activeH, minutes: activeM }}
            onDurationChange={({ hours, minutes }) => {
              setHour(hours);
              setMinute(minutes);
            }}
            styles={{
              theme: 'dark',
              backgroundColor: 'transparent',
              text: {
                color: '#CBD5E1',
                fontSize: 26,
                fontWeight: '600',
              },
              selectedPickerItem: {
                color: '#FF7A00',
                fontSize: 32,
                fontWeight: 'bold',
              },
              pickerItem: {
                fontSize: 22,
                color: '#64748B',
              },
              pickerLabel: {
                fontSize: 14,
                color: '#94A3B8',
                fontWeight: 'bold',
              },
              pickerContainer: {
                backgroundColor: 'transparent',
              },
            }}
          />
        </View>
      ) : (
        /* Big Digital Clock Tile */
        <View
          className="flex-row items-center justify-center rounded-3xl bg-surface-1 py-4"
          style={clayCard}
        >
          {/* Hour Section */}
          <View className="items-center">
            <Pressable
              accessibilityLabel="Bir saat artır"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-base"
              style={clayChip(false)}
              onPress={() => stepHour(1)}
            >
              <Text className="font-sans text-base font-bold text-text-high">▲</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={`Saat: ${String(activeH).padStart(2, '0')}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSegment === 'hour' }}
              className={`my-2 min-w-[76px] items-center justify-center rounded-2xl px-4 py-2 ${
                activeSegment === 'hour' ? 'bg-action-primary' : 'bg-surface-base'
              }`}
              style={clayChip(activeSegment === 'hour')}
              onPress={() => {
                triggerHaptic('light');
                setActiveSegment('hour');
              }}
              testID="time-picker.hourTab"
            >
              <Text
                className={`font-display text-4xl font-bold ${
                  activeSegment === 'hour' ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {String(activeH).padStart(2, '0')}
              </Text>
              <Text
                className={`font-sans text-[11px] font-semibold uppercase tracking-wider ${
                  activeSegment === 'hour' ? 'text-text-on/80' : 'text-text-low'
                }`}
              >
                Saat
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Bir saat azalt"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-base"
              style={clayChip(false)}
              onPress={() => stepHour(-1)}
            >
              <Text className="font-sans text-base font-bold text-text-high">▼</Text>
            </Pressable>
          </View>

          {/* Colon separator */}
          <Text className="mx-3 font-display text-4xl font-bold text-text-high">:</Text>

          {/* Minute Section */}
          <View className="items-center">
            <Pressable
              accessibilityLabel="Dakika artır"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-base"
              style={clayChip(false)}
              onPress={() => stepMinute(minuteInterval)}
            >
              <Text className="font-sans text-base font-bold text-text-high">▲</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={`Dakika: ${String(activeM).padStart(2, '0')}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSegment === 'minute' }}
              className={`my-2 min-w-[76px] items-center justify-center rounded-2xl px-4 py-2 ${
                activeSegment === 'minute' ? 'bg-action-primary' : 'bg-surface-base'
              }`}
              style={clayChip(activeSegment === 'minute')}
              onPress={() => {
                triggerHaptic('light');
                setActiveSegment('minute');
              }}
              testID="time-picker.minuteTab"
            >
              <Text
                className={`font-display text-4xl font-bold ${
                  activeSegment === 'minute' ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {String(activeM).padStart(2, '0')}
              </Text>
              <Text
                className={`font-sans text-[11px] font-semibold uppercase tracking-wider ${
                  activeSegment === 'minute' ? 'text-text-on/80' : 'text-text-low'
                }`}
              >
                Dakika
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Dakika azalt"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-base"
              style={clayChip(false)}
              onPress={() => stepMinute(-minuteInterval)}
            >
              <Text className="font-sans text-base font-bold text-text-high">▼</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Quick Presets Strip */}
      <View>
        <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
          Hızlı Seçim
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {DEFAULT_HOUR_PRESETS.map((h) => {
            const isMatch = activeH === h && activeM === 0;
            return (
              <Pressable
                key={`preset-${h}`}
                accessibilityRole="button"
                className={`rounded-full px-3 py-1.5 ${
                  isMatch ? 'bg-action-primary' : 'bg-surface-1'
                }`}
                style={clayChip(isMatch)}
                onPress={() => {
                  setHour(h);
                  setMinute(0);
                }}
              >
                <Text
                  className={`font-sans text-xs font-semibold ${
                    isMatch ? 'text-text-on' : 'text-text-high'
                  }`}
                >
                  {String(h).padStart(2, '0')}:00
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Grid selector depending on active segment */}
      {activeSegment === 'hour' ? (
        <View>
          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
            Saat (00 – 23)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 24 }, (_, h) => {
              const isSelected = activeH === h;
              return (
                <Pressable
                  key={`h-${h}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={`h-10 w-10 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  style={clayChip(isSelected)}
                  onPress={() => {
                    setHour(h);
                    // Automatically switch to minute selection for fast flow
                    setActiveSegment('minute');
                  }}
                  testID={`time-picker.hour.${h}`}
                >
                  <Text
                    className={`font-display text-sm font-semibold ${
                      isSelected ? 'text-text-on' : 'text-text-high'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View>
          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-low">
            Dakika (00 – 55)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {minutesList.map((m) => {
              const isSelected = activeM === m;
              return (
                <Pressable
                  key={`m-${m}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={`h-10 w-11 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  style={clayChip(isSelected)}
                  onPress={() => setMinute(m)}
                  testID={`time-picker.minute.${m}`}
                >
                  <Text
                    className={`font-display text-sm font-semibold ${
                      isSelected ? 'text-text-on' : 'text-text-high'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  if (presentation === 'inline') {
    return (
      <View className="gap-2" testID={testID}>
        {label ? (
          <Text className="font-sans text-sm font-semibold text-text-high">{label}</Text>
        ) : null}
        {renderPickerBody()}
        {error ? (
          <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-2" testID={testID}>
      {label ? (
        <Text className="mb-1.5 font-sans text-sm font-semibold text-text-high">{label}</Text>
      ) : null}

      {/* Tactile trigger card */}
      <Pressable
        accessibilityLabel={`${label}: ${currentFormatted}`}
        accessibilityRole="button"
        className={`flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3.5 ${
          error ? 'border border-feedback-error' : ''
        }`}
        style={clayCard}
        onPress={handleOpenSheet}
        testID={`${testID ?? 'time-picker'}.trigger`}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl bg-action-primary/15"
            style={clayChip(false)}
          >
            <Text className="font-sans text-base">⏰</Text>
          </View>

          <Text className="font-display text-lg font-bold text-text-high">
            {currentFormatted}
          </Text>
        </View>

        <View className="rounded-full bg-surface-base px-2.5 py-1" style={clayChip(false)}>
          <Text className="font-sans text-xs font-semibold text-action-secondary">
            {triggerActionLabel}
          </Text>
        </View>
      </Pressable>

      {error ? (
        <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
      ) : null}

      {/* Modal Bottom Sheet */}
      <Modal
        animationType="slide"
        onRequestClose={handleCancel}
        transparent
        visible={modalOpen}
      >
        <View className="flex-1 justify-end bg-black/45">
          <View className="rounded-t-[36px] bg-surface-base p-5 pb-8" style={claySheet}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-text-low/30" />

            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-display text-lg font-bold text-text-high">{label}</Text>
              <Pressable
                accessibilityLabel="Kapat"
                accessibilityRole="button"
                className="h-8 w-8 items-center justify-center rounded-full bg-surface-1"
                style={clayChip(false)}
                onPress={handleCancel}
              >
                <Text className="font-sans text-sm font-bold text-text-high">✕</Text>
              </Pressable>
            </View>

            {renderPickerBody()}

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button
                  label={t('common:cancel', { defaultValue: 'Vazgeç' })}
                  onPress={handleCancel}
                  variant="ghost"
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('common:confirm', { defaultValue: 'Kaydet' })}
                  onPress={handleConfirm}
                  testID={`${testID ?? 'time-picker'}.confirm`}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
