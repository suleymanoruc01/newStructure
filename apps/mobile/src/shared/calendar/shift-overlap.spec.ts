import {
  countOverlapPairs,
  intervalsOverlap,
  upcomingItems,
} from './shift-overlap';

test('counts overlapping pairs and skips already-shown upcoming shifts', () => {
  expect(
    intervalsOverlap(
      '2026-10-12T08:00:00.000Z',
      '2026-10-12T12:00:00.000Z',
      '2026-10-12T11:00:00.000Z',
      '2026-10-12T15:00:00.000Z',
    ),
  ).toBe(true);
  expect(
    countOverlapPairs([
      { startsAt: '2026-10-12T08:00:00.000Z', endsAt: '2026-10-12T12:00:00.000Z' },
      { startsAt: '2026-10-12T11:00:00.000Z', endsAt: '2026-10-12T15:00:00.000Z' },
      { startsAt: '2026-10-12T16:00:00.000Z', endsAt: '2026-10-12T18:00:00.000Z' },
    ]),
  ).toBe(1);
  expect(
    upcomingItems(
      [
        { id: 'a', startsAt: '2026-10-12T10:00:00.000Z' },
        { id: 'b', startsAt: '2026-10-13T10:00:00.000Z' },
        { id: 'c', startsAt: '2026-10-11T10:00:00.000Z' },
      ],
      '2026-10-12T00:00:00.000Z',
      new Set(['a']),
    ).map((item) => item.id),
  ).toEqual(['b']);
});
