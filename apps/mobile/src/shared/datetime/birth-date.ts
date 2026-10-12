export const MONTH_SHORT_TR = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function civilIso(year: number, month: number, day: number): string {
  const last = daysInMonth(year, month);
  const clamped = Math.min(Math.max(day, 1), last);
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

export function parseCivil(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

export function birthYears(now = new Date()): number[] {
  const youngest = now.getUTCFullYear() - 18;
  const oldest = now.getUTCFullYear() - 75;
  const years: number[] = [];
  for (let year = youngest; year >= oldest; year -= 1) {
    years.push(year);
  }
  return years;
}

export function birthDecade(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function birthDecades(now = new Date()): number[] {
  const decades: number[] = [];
  for (const year of birthYears(now)) {
    const decade = birthDecade(year);
    if (decades[decades.length - 1] !== decade) {
      decades.push(decade);
    }
  }
  return decades;
}

export function yearsInDecade(decade: number, now = new Date()): number[] {
  return birthYears(now).filter((year) => birthDecade(year) === decade);
}
