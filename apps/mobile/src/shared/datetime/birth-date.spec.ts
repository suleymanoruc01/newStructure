import {
  birthDecades,
  birthYears,
  civilIso,
  daysInMonth,
  parseCivil,
  yearsInDecade,
} from './birth-date';

test('clamps 31 February to the last civil day', () => {
  expect(daysInMonth(2024, 2)).toBe(29);
  expect(civilIso(2024, 2, 31)).toBe('2024-02-29');
  expect(civilIso(2025, 2, 31)).toBe('2025-02-28');
});

test('parses YYYY-MM-DD and rejects junk', () => {
  expect(parseCivil('2000-05-09')).toEqual({ year: 2000, month: 5, day: 9 });
  expect(parseCivil('2000/05/09')).toBeNull();
});

test('birth years start at 18 and run backward', () => {
  expect(birthYears(new Date('2026-10-12T00:00:00.000Z'))[0]).toBe(2008);
});

test('decades then years so the picker is not 58 chips', () => {
  const now = new Date('2026-10-12T00:00:00.000Z');
  expect(birthDecades(now)[0]).toBe(2000);
  expect(yearsInDecade(2000, now)[0]).toBe(2008);
  expect(yearsInDecade(2000, now).every((year) => year >= 2000 && year < 2010)).toBe(
    true,
  );
});
