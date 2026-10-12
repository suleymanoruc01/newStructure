import { ApiClientError } from '../../api/client';

export function formatMinuteOfDay(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function parseTimeToMinute(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new ApiClientError(
      'Saat biçimi HH:MM olmalı.',
      400,
      'VALIDATION_FAILED',
    );
  }
  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour > 23 || minute > 59) {
    throw new ApiClientError(
      'Geçersiz saat.',
      400,
      'VALIDATION_FAILED',
    );
  }
  return hour * 60 + minute;
}

export const AVAIL_HOURS = [6, 8, 9, 10, 12, 14, 16, 17, 18, 20, 22] as const;

export const DAY_NAMES_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;
