export function groupRevenueByBranch(
  items: {
    branchName?: string | null;
    jobTitle?: string | null;
    startsAt: string;
    endsAt: string;
    payAmountMinor?: number | null;
  }[],
  hoursOf: (start: string, end: string) => number | null,
  untitled: string,
): { label: string; count: number; hours: number; payMinor: number }[] {
  const groups = new Map<
    string,
    { count: number; hours: number; payMinor: number }
  >();
  for (const item of items) {
    const label = item.branchName || item.jobTitle || untitled;
    const current = groups.get(label) ?? { count: 0, hours: 0, payMinor: 0 };
    current.count += 1;
    current.hours += hoursOf(item.startsAt, item.endsAt) ?? 0;
    current.payMinor += item.payAmountMinor ?? 0;
    groups.set(label, current);
  }
  return [...groups.entries()]
    .map(([label, row]) => ({ label, ...row }))
    .sort((a, b) => b.payMinor - a.payMinor);
}

export function groupRevenueByTitle(
  items: Parameters<typeof groupRevenueByBranch>[0],
  hoursOf: (start: string, end: string) => number | null,
  untitled: string,
): ReturnType<typeof groupRevenueByBranch> {
  return groupRevenueByBranch(
    items.map((item) => ({ ...item, branchName: item.jobTitle, jobTitle: null })),
    hoursOf,
    untitled,
  );
}
