import { groupRevenueByBranch, groupRevenueByTitle } from './group-by-branch';

test('groups pay and hours by branch, untitled when both names missing', () => {
  const hoursOf = (start: string, end: string) =>
    start === 'a' ? 4 : end === 'd' ? 2 : 0;
  const grouped = groupRevenueByBranch(
    [
      {
        branchName: 'Kadıköy',
        startsAt: 'a',
        endsAt: 'b',
        payAmountMinor: 40_000,
      },
      {
        branchName: 'Kadıköy',
        startsAt: 'c',
        endsAt: 'd',
        payAmountMinor: 20_000,
      },
      {
        startsAt: 'a',
        endsAt: 'b',
        payAmountMinor: 10_000,
      },
    ],
    hoursOf,
    'Vardiya',
  );
  expect(grouped[0]).toEqual({
    label: 'Kadıköy',
    count: 2,
    hours: 6,
    payMinor: 60_000,
  });
  expect(grouped[1]?.label).toBe('Vardiya');
});

test('groups by job title when asked', () => {
  const grouped = groupRevenueByTitle(
    [
      {
        branchName: 'Kadıköy',
        jobTitle: 'Garson',
        startsAt: 'a',
        endsAt: 'b',
        payAmountMinor: 10_000,
      },
      {
        branchName: 'Beşiktaş',
        jobTitle: 'Garson',
        startsAt: 'a',
        endsAt: 'b',
        payAmountMinor: 20_000,
      },
    ],
    () => 4,
    'Vardiya',
  );
  expect(grouped).toEqual([
    { label: 'Garson', count: 2, hours: 8, payMinor: 30_000 },
  ]);
});
