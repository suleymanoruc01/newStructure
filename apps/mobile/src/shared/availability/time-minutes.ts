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

export function computeRangeDuration(
  startMinute: number,
  endMinute: number,
  crossesMidnight?: boolean,
): { durationMinutes: number; formatted: string } {
  let diff = endMinute - startMinute;
  if (diff <= 0 || crossesMidnight) {
    diff = 1440 - startMinute + endMinute;
  }
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  let formatted = '';
  if (hours > 0 && mins > 0) {
    formatted = `${hours} sa ${mins} dk`;
  } else if (hours > 0) {
    formatted = `${hours} saat`;
  } else {
    formatted = `${mins} dk`;
  }
  return { durationMinutes: diff, formatted };
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const current = parseTimeToMinute(time);
  const total = (current + minutesToAdd) % 1440;
  const normalized = total < 0 ? total + 1440 : total;
  return formatMinuteOfDay(normalized);
}

export function formatTimeRange(
  start: string,
  end: string,
  crossesMidnight?: boolean,
): string {
  const duration = computeRangeDuration(
    parseTimeToMinute(start),
    parseTimeToMinute(end),
    crossesMidnight,
  );
  return `${start} – ${end} (${duration.formatted})`;
}

