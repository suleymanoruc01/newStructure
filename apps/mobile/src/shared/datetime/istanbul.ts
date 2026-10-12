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

export function formatIstanbul(value: string | Date, zone = timeZone): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('tr-TR', { timeZone: zone });
}

export function istanbulDayKey(value: string | Date, zone = timeZone): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function weekDayKeys(anchor: Date, zone = timeZone): string[] {
  const key = istanbulDayKey(anchor, zone);
  const [year, month, day] = key.split('-').map(Number);
  const noon = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    weekday: 'short',
  }).format(noon);
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
  const [year, month] = key.split('-').map(Number);
  const first = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1, 12));
  const start = weekDayKeys(first, zone)[0] ?? istanbulDayKey(first, zone);
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const noon = new Date(
    Date.UTC(startYear ?? 1970, (startMonth ?? 1) - 1, startDay ?? 1, 12),
  );
  return Array.from({ length: 42 }, (_, offset) => {
    const next = new Date(noon);
    next.setUTCDate(noon.getUTCDate() + offset);
    return istanbulDayKey(next, zone);
  });
}

export function shiftMonthKey(dayKey: string, delta: number, zone = timeZone): string {
  const [year, month] = dayKey.split('-').map(Number);
  const noon = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1 + delta, 1, 12));
  return istanbulDayKey(noon, zone);
}

const WEEKDAY_SUN0 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function weekdaySun0(now = new Date(), zone = timeZone): number {
  const label = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: zone,
  }).format(now);
  const index = WEEKDAY_SUN0.findIndex((day) => day === label.slice(0, 3));
  return index >= 0 ? index : now.getUTCDay();
}
