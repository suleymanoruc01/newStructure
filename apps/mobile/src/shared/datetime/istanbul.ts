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
