import { partitionHomeShifts } from './partition-home';

test('splits active in-shift from upcoming approved', () => {
  const { active, upcoming } = partitionHomeShifts([
    { status: 'checked_in', startsAt: '2026-10-12T10:00:00.000Z' },
    { status: 'scheduled', startsAt: '2026-10-14T08:00:00.000Z' },
    { status: 'awaiting_confirm', startsAt: '2026-10-13T08:00:00.000Z' },
    { status: 'completed', startsAt: '2026-10-11T08:00:00.000Z' },
  ]);
  expect(active.map((item) => item.status)).toEqual(['checked_in']);
  expect(upcoming.map((item) => item.status)).toEqual([
    'awaiting_confirm',
    'scheduled',
  ]);
});
