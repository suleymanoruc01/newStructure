export type JobsListTab = 'feed' | 'applied' | 'approved' | 'previous';

export function jobsListTabStatuses(
  tab: Exclude<JobsListTab, 'feed'>,
): string[] {
  switch (tab) {
    case 'applied':
      return ['pending'];
    case 'approved':
      return ['accepted', 'substitute'];
    case 'previous':
      return ['completed', 'released'];
    default: {
      const unreachable: never = tab;
      return unreachable;
    }
  }
}
