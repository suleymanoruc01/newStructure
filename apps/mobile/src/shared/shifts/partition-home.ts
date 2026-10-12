const ACTIVE = new Set(['checked_in', 'manual_confirmed']);
const UPCOMING = new Set([
  'scheduled',
  'awaiting_confirm',
  'can_come',
  'cannot_come',
]);

export function partitionHomeShifts<T extends { status: string; startsAt: string }>(
  items: T[],
): { active: T[]; upcoming: T[] } {
  return {
    active: items.filter((item) => ACTIVE.has(item.status)),
    upcoming: items
      .filter((item) => UPCOMING.has(item.status))
      .slice()
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}
