export type FeedSort = 'start' | 'distance' | 'pay';

export function sortFeed<
  T extends {
    startsAt: string;
    distanceKm?: number | null;
    payAmountMinor?: number | null;
  },
>(items: T[], sort: FeedSort): T[] {
  return [...items].sort((left, right) => {
    if (sort === 'distance') {
      return (
        (left.distanceKm ?? Number.POSITIVE_INFINITY) -
        (right.distanceKm ?? Number.POSITIVE_INFINITY)
      );
    }
    if (sort === 'pay') {
      return (right.payAmountMinor ?? 0) - (left.payAmountMinor ?? 0);
    }
    return left.startsAt.localeCompare(right.startsAt);
  });
}
