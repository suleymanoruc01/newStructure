import { formatIstanbul, formatTr, istanbulDayKey, weekdaySun0, weekDayKeys, monthGridKeys } from './istanbul';

test('bad dates render empty instead of throwing', () => {
  expect(formatIstanbul('not-a-date')).toBe('');
  expect(istanbulDayKey(undefined)).toBe('');
  expect(formatTr('nope', 'Europe/Istanbul', { day: 'numeric' })).toBe('');
  expect(() => weekDayKeys(new Date(Number.NaN))).not.toThrow();
  expect(() => monthGridKeys(new Date(Number.NaN))).not.toThrow();
  expect(weekdaySun0(new Date(Number.NaN))).toBe(0);
});

test('Istanbul weekday is Sunday=0', () => {
  expect(
    weekdaySun0(new Date('2026-10-12T12:00:00.000Z'), 'Europe/Istanbul'),
  ).toBe(1);
});
