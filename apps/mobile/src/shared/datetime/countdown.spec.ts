import { durationHours, elapsedLabel, remainingLabel } from './countdown';

test('remaining and elapsed labels', () => {
  const now = Date.parse('2026-10-12T12:00:00.000Z');
  expect(remainingLabel('2026-10-12T14:30:00.000Z', now)).toBe('2 sa 30 dk');
  expect(elapsedLabel('2026-10-12T10:00:00.000Z', now)).toBe('2 sa');
  expect(durationHours('2026-10-12T08:00:00.000Z', '2026-10-12T16:00:00.000Z')).toBe(
    8,
  );
});
