import { sortFeed } from './sort-feed';

const jobs = [
  { startsAt: '2026-03-02T08:00:00.000Z', distanceKm: 12, payAmountMinor: 40_000, matchScore: 70 },
  { startsAt: '2026-03-01T08:00:00.000Z', distanceKm: 3, payAmountMinor: 50_000, matchScore: 95 },
  { startsAt: '2026-03-03T08:00:00.000Z', distanceKm: null, payAmountMinor: null, matchScore: 40 },
];

test('sorts feed by match, start, distance, then pay', () => {
  expect(sortFeed(jobs, 'match')[0]?.matchScore).toBe(95);
  expect(sortFeed(jobs, 'start').map((job) => job.startsAt)[0]).toBe(
    '2026-03-01T08:00:00.000Z',
  );
  expect(sortFeed(jobs, 'distance')[0]?.distanceKm).toBe(3);
  expect(sortFeed(jobs, 'pay')[0]?.payAmountMinor).toBe(50_000);
});
