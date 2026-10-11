export const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type IstanbulCivil = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) {
    return cached;
  }
  const created = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  formatters.set(timeZone, created);
  return created;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((item) => item.type === type)?.value ?? '';
}

/** Civil clock for Turkey. Instants stay UTC; this is only the calendar. */
export function istanbulCivil(
  at: Date,
  timeZone: string = ISTANBUL_TIME_ZONE,
): IstanbulCivil {
  const parts = formatter(timeZone).formatToParts(at);
  let hour = Number(part(parts, 'hour'));
  if (hour === 24) {
    hour = 0;
  }
  const weekday = WEEKDAY[part(parts, 'weekday')];
  if (weekday === undefined) {
    throw new Error(`Unknown Istanbul weekday: ${part(parts, 'weekday')}`);
  }
  return {
    year: Number(part(parts, 'year')),
    month: Number(part(parts, 'month')),
    day: Number(part(parts, 'day')),
    weekday,
    minutes: hour * 60 + Number(part(parts, 'minute')),
  };
}

export function istanbulInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = ISTANBUL_TIME_ZONE,
): Date {
  const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = wanted;
  for (let pass = 0; pass < 2; pass += 1) {
    const civil = istanbulCivil(new Date(utc), timeZone);
    const shown = Date.UTC(
      civil.year,
      civil.month - 1,
      civil.day,
      Math.floor(civil.minutes / 60),
      civil.minutes % 60,
      0,
    );
    utc -= shown - wanted;
  }
  return new Date(utc);
}

export function formatIstanbulDateTime(
  at: Date,
  options: Intl.DateTimeFormatOptions = {},
  timeZone: string = ISTANBUL_TIME_ZONE,
): string {
  return at.toLocaleString('tr-TR', {
    ...options,
    timeZone,
  });
}
