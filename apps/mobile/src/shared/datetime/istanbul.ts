import { useSyncExternalStore } from 'react';

const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

let timeZone = ISTANBUL_TIME_ZONE;
const listeners = new Set<() => void>();

export function setDisplayTimeZone(zone: string): void {
  if (!zone || zone === timeZone) {
    return;
  }
  timeZone = zone;
  for (const listener of listeners) {
    listener();
  }
}

export function useDisplayTimeZone(): string {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => timeZone,
  );
}

function finiteDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function safeFormat(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!Number.isFinite(date.getTime())) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return '';
  }
}

function civilParts(key: string): [number, number, number] {
  const [year, month, day] = key.split('-').map(Number);
  return [
    Number.isFinite(year) ? year : 1970,
    Number.isFinite(month) ? month : 1,
    Number.isFinite(day) ? day : 1,
  ];
}

export function formatTr(
  value: string | Date | null | undefined,
  zone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = finiteDate(value);
  if (!date) {
    return '';
  }
  return safeFormat(date, 'tr-TR', { ...options, timeZone: zone });
}

export function formatIstanbul(
  value: string | Date | null | undefined,
  zone = timeZone,
): string {
  const date = finiteDate(value);
  if (!date) {
    return '';
  }
  try {
    return date.toLocaleString('tr-TR', { timeZone: zone });
  } catch {
    return '';
  }
}

export function istanbulDayKey(
  value: string | Date | null | undefined,
  zone = timeZone,
): string {
  const date = finiteDate(value);
  if (!date) {
    return '';
  }
  return safeFormat(date, 'en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function weekDayKeys(anchor: Date, zone = timeZone): string[] {
  const key = istanbulDayKey(anchor, zone);
  const [year, month, day] = civilParts(key);
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = safeFormat(noon, 'en-US', {
    timeZone: zone,
    weekday: 'short',
  });
  const index = WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);
  const monday = new Date(noon);
  monday.setUTCDate(monday.getUTCDate() - (index < 0 ? 0 : index));
  return WEEKDAYS.map((_, offset) => {
    const next = new Date(monday);
    next.setUTCDate(monday.getUTCDate() + offset);
    return istanbulDayKey(next, zone);
  });
}

export function monthGridKeys(anchor: Date, zone = timeZone): string[] {
  const key = istanbulDayKey(anchor, zone);
  const [year, month] = civilParts(key);
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const start = weekDayKeys(first, zone)[0] ?? istanbulDayKey(first, zone);
  const [startYear, startMonth, startDay] = civilParts(start);
  const noon = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12));
  return Array.from({ length: 42 }, (_, offset) => {
    const next = new Date(noon);
    next.setUTCDate(noon.getUTCDate() + offset);
    return istanbulDayKey(next, zone);
  });
}

export function shiftMonthKey(dayKey: string, delta: number, zone = timeZone): string {
  const [year, month] = civilParts(dayKey);
  const noon = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  return istanbulDayKey(noon, zone);
}

const WEEKDAY_SUN0 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function weekdaySun0(now = new Date(), zone = timeZone): number {
  if (!Number.isFinite(now.getTime())) {
    return 0;
  }
  const label = safeFormat(now, 'en-US', {
    weekday: 'short',
    timeZone: zone,
  });
  const index = WEEKDAY_SUN0.findIndex((day) => day === label.slice(0, 3));
  return index >= 0 ? index : now.getUTCDay();
}
