import {
  addDaysToDayKey,
  dayChipLabel,
  nextIstanbulDayKeys,
  shiftWallToIso,
  wallToIso,
} from './shift-when';

test('wall clock in Istanbul becomes UTC ISO without a date picker', () => {
  expect(wallToIso('2026-10-13', 9, 8)).toEqual({
    startsAt: '2026-10-13T06:00:00.000Z',
    endsAt: '2026-10-13T14:00:00.000Z',
  });
  expect(wallToIso('2026-10-13', '09:00', 8)).toEqual({
    startsAt: '2026-10-13T06:00:00.000Z',
    endsAt: '2026-10-13T14:00:00.000Z',
  });
  expect(wallToIso('2026-10-13', '14:30', 4.5)).toEqual({
    startsAt: '2026-10-13T11:30:00.000Z',
    endsAt: '2026-10-13T16:00:00.000Z',
  });
});

test('handles shifts starting on one day and continuing to the next day', () => {
  // 22:00 to 06:00 (starts 16 Oct, ends 17 Oct)
  const result = shiftWallToIso('2026-10-16', '22:00', '06:00');
  expect(result.isNextDay).toBe(true);
  expect(result.durationHours).toBe(8);
  expect(result.startsAt).toBe('2026-10-16T19:00:00.000Z');
  expect(result.endsAt).toBe('2026-10-17T03:00:00.000Z');

  // Next day key utility
  expect(addDaysToDayKey('2026-10-16', 1)).toBe('2026-10-17');
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
