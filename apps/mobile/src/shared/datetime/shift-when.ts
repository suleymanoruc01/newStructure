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
  const noon = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
  return Array.from({ length: count }, (_, offset) => {
    const next = new Date(noon);
    next.setUTCDate(noon.getUTCDate() + offset);
    return istanbulDayKey(next, zone);
  });
}

function zonedWallToUtcMs(
  dayKey: string,
  hour: number,
  timeZone: string,
): number {
  const hh = String(hour).padStart(2, '0');
  const utcGuess = new Date(`${dayKey}T${hh}:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcGuess);
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
  hour: number,
  durationHours: number,
  timeZone = 'Europe/Istanbul',
): { startsAt: string; endsAt: string } {
  const starts = zonedWallToUtcMs(dayKey, hour, timeZone);
  return {
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(starts + durationHours * 3_600_000).toISOString(),
  };
}

export function dayChipLabel(dayKey: string, zone?: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const noon = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
  return noon.toLocaleDateString('tr-TR', {
    timeZone: zone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
