import { istanbulDayKey } from './istanbul';

export const SHIFT_START_HOURS = [6, 8, 9, 10, 14, 16, 18, 22] as const;
export const SHIFT_DURATIONS_H = [4, 6, 8, 12] as const;

export function nextIstanbulDayKeys(
  count: number,
  from = new Date(),
  zone?: string,
): string[] {
  const today = istanbulDayKey(from, zone);
  const [year, month, day] = today.split('-').map(Number);
  const noon = new Date(
    Date.UTC(
      Number.isFinite(year) ? year : 1970,
      (Number.isFinite(month) ? month : 1) - 1,
      Number.isFinite(day) ? day : 1,
      12,
    ),
  );
  return Array.from({ length: count }, (_, offset) => {
    const next = new Date(noon);
    next.setUTCDate(noon.getUTCDate() + offset);
    return istanbulDayKey(next, zone);
  });
}

function zonedWallToUtcMs(
  dayKey: string,
  timeOrHour: string | number,
  timeZone: string,
): number {
  let hour = 9;
  let minute = 0;
  if (typeof timeOrHour === 'string') {
    const parts = timeOrHour.trim().split(':');
    hour = Number.parseInt(parts[0] ?? '9', 10);
    minute = Number.parseInt(parts[1] ?? '0', 10);
  } else {
    hour = timeOrHour;
    minute = 0;
  }
  if (!Number.isFinite(hour)) hour = 9;
  if (!Number.isFinite(minute)) minute = 0;

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const utcGuess = new Date(`${dayKey}T${hh}:${mm}:00.000Z`);
  if (!Number.isFinite(utcGuess.getTime())) {
    return Number.NaN;
  }
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(utcGuess);
  } catch {
    return Number.NaN;
  }
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asIfUtc = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second'),
  );
  return utcGuess.getTime() - (asIfUtc - utcGuess.getTime());
}

export function wallToIso(
  dayKey: string,
  start: string | number,
  durationHours: number,
  timeZone = 'Europe/Istanbul',
): { startsAt: string; endsAt: string } {
  const starts = zonedWallToUtcMs(dayKey, start, timeZone);
  if (!Number.isFinite(starts)) {
    return { startsAt: '', endsAt: '' };
  }
  const durationMs = Math.round(durationHours * 3_600_000);
  return {
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(starts + durationMs).toISOString(),
  };
}

export function addDaysToDayKey(dayKey: string, daysToAdd = 1): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(
    Date.UTC(
      Number.isFinite(year) ? year : 1970,
      (Number.isFinite(month) ? month : 1) - 1,
      Number.isFinite(day) ? day : 1,
      12,
    ),
  );
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftWallToIso(
  startDayKey: string,
  startTime: string,
  endTime: string,
  forceNextDay?: boolean,
  timeZone = 'Europe/Istanbul',
): {
  startsAt: string;
  endsAt: string;
  durationHours: number;
  durationMinutes: number;
  isNextDay: boolean;
  durationFormatted: string;
} {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMin = (Number.isFinite(sH) ? sH! : 9) * 60 + (Number.isFinite(sM) ? sM! : 0);
  const endMin = (Number.isFinite(eH) ? eH! : 17) * 60 + (Number.isFinite(eM) ? eM! : 0);

  const isNextDay = forceNextDay ?? endMin <= startMin;
  let diffMin = endMin - startMin;
  if (isNextDay || diffMin <= 0) {
    diffMin = 1440 - startMin + endMin;
  }
  const durationHours = Math.round((diffMin / 60) * 10) / 10;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  const durationFormatted = m > 0 ? `${h} sa ${m} dk` : `${h} saat`;

  const starts = zonedWallToUtcMs(startDayKey, startTime, timeZone);
  if (!Number.isFinite(starts)) {
    return {
      startsAt: '',
      endsAt: '',
      durationHours: 0,
      durationMinutes: 0,
      isNextDay,
      durationFormatted: '',
    };
  }

  const durationMs = diffMin * 60_000;
  return {
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(starts + durationMs).toISOString(),
    durationHours,
    durationMinutes: diffMin,
    isNextDay,
    durationFormatted,
  };
}

export function dayChipLabel(dayKey: string, zone?: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const noon = new Date(
    Date.UTC(
      Number.isFinite(year) ? year : 1970,
      (Number.isFinite(month) ? month : 1) - 1,
      Number.isFinite(day) ? day : 1,
      12,
    ),
  );
  try {
    return noon.toLocaleDateString('tr-TR', {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}
