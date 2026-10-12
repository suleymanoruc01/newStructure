import { dayChipLabel, nextIstanbulDayKeys, wallToIso } from './shift-when';

test('wall clock in Istanbul becomes UTC ISO without a date picker', () => {
  expect(wallToIso('2026-10-13', 9, 8)).toEqual({
    startsAt: '2026-10-13T06:00:00.000Z',
    endsAt: '2026-10-13T14:00:00.000Z',
  });
});

test('wall clock uses the display time zone, not a hardcoded +03 offset', () => {
  expect(wallToIso('2026-10-13', 9, 8, 'America/New_York')).toEqual({
    startsAt: '2026-10-13T13:00:00.000Z',
    endsAt: '2026-10-13T21:00:00.000Z',
  });
});

test('next days start on the civil Istanbul date', () => {
  expect(
    nextIstanbulDayKeys(2, new Date('2026-10-12T21:30:00.000Z'), 'Europe/Istanbul'),
  ).toEqual(['2026-10-13', '2026-10-14']);
});

test('chip label is Turkish short date', () => {
  expect(dayChipLabel('2026-10-13', 'Europe/Istanbul')).toMatch(/13/);
});
