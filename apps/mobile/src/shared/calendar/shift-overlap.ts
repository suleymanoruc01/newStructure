export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function countOverlapPairs(
  items: { startsAt: string; endsAt: string }[],
): number {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (
        intervalsOverlap(
          items[i]!.startsAt,
          items[i]!.endsAt,
          items[j]!.startsAt,
          items[j]!.endsAt,
        )
      ) {
        count += 1;
      }
    }
  }
  return count;
}

export function upcomingItems<T extends { id: string; startsAt: string }>(
  items: T[],
  nowIso: string,
  skipIds: Set<string>,
  limit = 3,
): T[] {
  return items
    .filter((item) => item.startsAt >= nowIso && !skipIds.has(item.id))
    .sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? ''))
    .slice(0, limit);
}
