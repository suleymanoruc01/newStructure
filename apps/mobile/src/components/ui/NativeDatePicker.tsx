import React, { useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatTr,
  istanbulDayKey,
  useDisplayTimeZone,
} from '../../shared/datetime/istanbul';
import {
  MONTH_SHORT_TR,
  birthDecade,
  birthDecades,
  civilIso,
  daysInMonth,
  parseCivil,
  yearsInDecade,
} from '../../shared/datetime/birth-date';
import { triggerHaptic } from '../../shared/ui/haptics';
import { Button } from './Button';
import { ClayCard } from './ClayCard';
import { clayCard, clayChip, claySheet } from './clay';
import { NativeCalendar } from './NativeCalendar';
import { Pressable } from './Pressable';

export interface NativeDatePickerProps {
  label: string;
  value: string; // 'YYYY-MM-DD' or ISO format
  onChange: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  error?: string | null;
  /** 'sheet' renders a tactile tap-to-open field; 'inline' embeds the picker directly */
  presentation?: 'sheet' | 'inline';
  /** 'calendar' for month grid navigation, 'wheel' for decade/year/month/day selectors */
  mode?: 'calendar' | 'wheel';
  testID?: string;
}

export function NativeDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder,
  error,
  presentation = 'sheet',
  mode = 'calendar',
  testID,
}: NativeDatePickerProps) {
  const { t } = useTranslation(['common', 'worker']);
  const zone = useDisplayTimeZone();
  const [modalOpen, setModalOpen] = useState(false);

  // Normalize initial value
  const normalizedKey = useMemo(() => {
    if (!value) return '';
    if (value.includes('T')) {
      return istanbulDayKey(value, zone);
    }
    return value.slice(0, 10);
  }, [value, zone]);

  // Temporary staging state while sheet is open
  const [draftKey, setDraftKey] = useState(normalizedKey);

  // Parsed civil for wheel / birth date mode
  const parsed = useMemo(() => parseCivil(draftKey || normalizedKey), [draftKey, normalizedKey]);
  const activeYear = parsed?.year ?? birthDecades()[0] ?? 2000;
  const activeMonth = parsed?.month ?? 1;
  const activeDay = parsed?.day ?? 1;
  const activeDecade = birthDecade(activeYear);
  const dayCount = daysInMonth(activeYear, activeMonth);

  const writeCivil = (y: number, m: number, d: number) => {
    triggerHaptic('light');
    const clampedD = Math.min(d, daysInMonth(y, m));
    const nextKey = civilIso(y, m, clampedD);
    setDraftKey(nextKey);
    if (presentation === 'inline') {
      onChange(nextKey);
    }
  };

  const handleOpenSheet = () => {
    triggerHaptic('light');
    setDraftKey(normalizedKey || istanbulDayKey(new Date(), zone));
    setModalOpen(true);
  };

  const handleConfirm = () => {
    triggerHaptic('light');
    onChange(draftKey);
    setModalOpen(false);
  };

  const handleCancel = () => {
    triggerHaptic('light');
    setModalOpen(false);
  };

  // Formatted date string in Turkish
  const displayLabel = useMemo(() => {
    if (!normalizedKey) {
      return placeholder ?? t('common:selectDate', { defaultValue: 'Tarih seçin' });
    }
    return formatTr(`${normalizedKey}T12:00:00.000Z`, zone, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'short',
    });
  }, [normalizedKey, placeholder, t, zone]);

  // Quick preset shortcuts (Bugün, Yarın)
  const todayKey = istanbulDayKey(new Date(), zone);
  const tomorrowKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return istanbulDayKey(d, zone);
  }, [zone]);

  const renderPickerContent = () => {
    if (mode === 'wheel') {
      return (
        <View className="gap-3">
          {/* Decade Row */}
          <View>
            <Text className="mb-1 font-sans text-xs font-semibold text-text-medium">
              Dönem
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {birthDecades().map((dec) => (
                <Pressable
                  key={dec}
                  accessibilityRole="button"
                  className={`rounded-full px-3 py-1.5 ${
                    activeDecade === dec ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  style={clayChip(activeDecade === dec)}
                  onPress={() => writeCivil(dec, activeMonth, activeDay)}
                >
                  <Text
                    className={`font-sans text-xs ${
                      activeDecade === dec ? 'font-semibold text-text-on' : 'text-text-high'
                    }`}
                  >
                    {dec}’ler
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Years Row */}
          <View>
            <Text className="mb-1 font-sans text-xs font-semibold text-text-medium">
              Yıl
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {yearsInDecade(activeDecade).map((yr) => (
                <Pressable
                  key={yr}
                  accessibilityRole="button"
                  className={`rounded-full px-3 py-1.5 ${
                    activeYear === yr ? 'bg-action-primary' : 'bg-surface-1'
                  }`}
                  style={clayChip(activeYear === yr)}
                  onPress={() => writeCivil(yr, activeMonth, activeDay)}
                >
                  <Text
                    className={`font-sans text-xs ${
                      activeYear === yr ? 'font-semibold text-text-on' : 'text-text-high'
                    }`}
                  >
                    {yr}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Months Row */}
          <View>
            <Text className="mb-1 font-sans text-xs font-semibold text-text-medium">
              Ay
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {MONTH_SHORT_TR.map((mLabel, idx) => {
                const mNum = idx + 1;
                const isSelected = activeMonth === mNum;
                return (
                  <Pressable
                    key={mLabel}
                    accessibilityRole="button"
                    className={`rounded-full px-2.5 py-1 ${
                      isSelected ? 'bg-action-primary' : 'bg-surface-1'
                    }`}
                    style={clayChip(isSelected)}
                    onPress={() => writeCivil(activeYear, mNum, activeDay)}
                  >
                    <Text
                      className={`font-sans text-xs ${
                        isSelected ? 'font-semibold text-text-on' : 'text-text-high'
                      }`}
                    >
                      {mLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Days Grid */}
          <View>
            <Text className="mb-1 font-sans text-xs font-semibold text-text-medium">
              Gün
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {Array.from({ length: dayCount }, (_, idx) => {
                const dNum = idx + 1;
                const isSelected = activeDay === dNum;
                return (
                  <Pressable
                    key={dNum}
                    accessibilityRole="button"
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-action-primary' : 'bg-surface-1'
                    }`}
                    style={clayChip(isSelected)}
                    onPress={() => writeCivil(activeYear, activeMonth, dNum)}
                  >
                    <Text
                      className={`font-sans text-xs ${
                        isSelected ? 'font-semibold text-text-on' : 'text-text-high'
                      }`}
                    >
                      {dNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    // Default: 'calendar' mode
    return (
      <View className="gap-2">
        {/* Presets */}
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            className={`rounded-full px-3 py-1.5 ${
              (draftKey || normalizedKey) === todayKey ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            style={clayChip((draftKey || normalizedKey) === todayKey)}
            onPress={() => {
              triggerHaptic('light');
              setDraftKey(todayKey);
              if (presentation === 'inline') onChange(todayKey);
            }}
          >
            <Text
              className={`font-sans text-xs font-semibold ${
                (draftKey || normalizedKey) === todayKey ? 'text-text-on' : 'text-text-high'
              }`}
            >
              Bugün
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className={`rounded-full px-3 py-1.5 ${
              (draftKey || normalizedKey) === tomorrowKey ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            style={clayChip((draftKey || normalizedKey) === tomorrowKey)}
            onPress={() => {
              triggerHaptic('light');
              setDraftKey(tomorrowKey);
              if (presentation === 'inline') onChange(tomorrowKey);
            }}
          >
            <Text
              className={`font-sans text-xs font-semibold ${
                (draftKey || normalizedKey) === tomorrowKey ? 'text-text-on' : 'text-text-high'
              }`}
            >
              Yarın
            </Text>
          </Pressable>
        </View>

        <NativeCalendar
          maxDate={maxDate}
          minDate={minDate}
          mode="single"
          onSelectDate={(key) => {
            setDraftKey(key);
            if (presentation === 'inline') {
              onChange(key);
            }
          }}
          selectedDate={draftKey || normalizedKey}
        />
      </View>
    );
  };

  if (presentation === 'inline') {
    return (
      <View className="gap-2" testID={testID}>
        <Text className="font-sans text-sm font-semibold text-text-high">{label}</Text>
        {renderPickerContent()}
        {error ? (
          <Text className="font-sans mt-1 text-sm text-feedback-error">{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-2" testID={testID}>
      <Text className="mb-1.5 font-sans text-sm font-semibold text-text-high">{label}</Text>

      {/* Tactile trigger card */}
      <Pressable
        accessibilityLabel={`${label}: ${displayLabel}`}
        accessibilityRole="button"
        className={`flex-row items-center justify-between rounded-[22px] bg-surface-1 px-4 py-3.5 ${
          error ? 'border border-feedback-error' : ''
        }`}
        style={clayCard}
        onPress={handleOpenSheet}
        testID={`${testID ?? 'date-picker'}.trigger`}
      >
        <View className="flex-row items-center gap-3">
          {/* Calendar pill icon */}
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl bg-action-primary/15"
            style={clayChip(false)}
          >
            <Text className="font-sans text-base">📅</Text>
          </View>

          <View>
            <Text
              className={`font-display text-base ${
                normalizedKey ? 'font-semibold text-text-high' : 'text-text-low'
              }`}
            >
              {displayLabel}
            </Text>
          </View>
        </View>

        <View className="rounded-full bg-surface-base px-2.5 py-1" style={clayChip(false)}>
          <Text className="font-sans text-xs font-semibold text-action-secondary">Değiştir</Text>
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
          <View className="max-h-[85%] rounded-t-[36px] bg-surface-base p-5 pb-8" style={claySheet}>
            {/* Sheet Handle */}
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-text-low/30" />

            {/* Sheet Header */}
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

            {/* Content */}
            {renderPickerContent()}

            {/* Actions */}
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
                  label={t('common:confirm', { defaultValue: 'Seç' })}
                  onPress={handleConfirm}
                  testID={`${testID ?? 'date-picker'}.confirm`}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
