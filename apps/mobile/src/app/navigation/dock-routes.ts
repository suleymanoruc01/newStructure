import type { ShiftStatus } from '@parton/api-contracts';

export function dockHidden(nestedIndex: number | undefined): boolean {
  return (nestedIndex ?? 0) > 0;
}

export function workerShiftRoute(status: ShiftStatus): string | null {
  switch (status) {
    case 'scheduled':
    case 'awaiting_confirm':
    case 'cannot_come':
      return 'WorkerShiftAvailability';
    case 'can_come':
      return 'WorkerShiftCheckIn';
    case 'checked_in':
    case 'manual_confirmed':
      return 'WorkerShiftInShift';
    case 'released':
    case 'completed':
      return null;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export const WORKER_SCREEN_TAB: Record<string, string> = {
  WorkerHome: 'WorkerHome',
  WorkerShiftAvailability: 'WorkerHome',
  WorkerShiftCheckIn: 'WorkerHome',
  WorkerShiftInShift: 'WorkerHome',
  WorkerShiftCheckOut: 'WorkerHome',
  WorkerShiftDispute: 'WorkerHome',
  SharedRatingsPending: 'WorkerHome',
  SharedRatingsCompose: 'WorkerHome',
  SharedNotificationsList: 'WorkerHome',
  SharedNotificationDetail: 'WorkerHome',
  SharedNotificationPrefs: 'WorkerHome',
  WorkerJobsList: 'WorkerJobs',
  WorkerJobDetail: 'WorkerJobs',
  WorkerJobApply: 'WorkerJobs',
  WorkerCalendar: 'WorkerCalendar',
  WorkerAvailabilityEdit: 'WorkerCalendar',
  WorkerProfileRoot: 'WorkerProfile',
  WorkerProfileEdit: 'WorkerProfile',
  WorkerApplicationsList: 'WorkerProfile',
  WorkerFavoritesList: 'WorkerProfile',
  WorkerDocumentsList: 'WorkerProfile',
  WorkerDocumentsUpload: 'WorkerProfile',
  SharedAbuseReport: 'WorkerProfile',
};

export const EMPLOYER_SCREEN_TAB: Record<string, string> = {
  EmployerHome: 'EmployerHome',
  EmployerTokensRoot: 'EmployerHome',
  EmployerTokenTopUp: 'EmployerHome',
  EmployerOpenDisputes: 'EmployerHome',
  EmployerShiftManualConfirm: 'EmployerHome',
  SharedNotificationsList: 'EmployerHome',
  SharedNotificationDetail: 'EmployerHome',
  SharedNotificationPrefs: 'EmployerHome',
  EmployerJobsList: 'EmployerJobs',
  EmployerCreateJob: 'EmployerJobs',
  EmployerJobDetail: 'EmployerJobs',
  EmployerApplicants: 'EmployerJobs',
  EmployerVerificationStatus: 'EmployerJobs',
  EmployerBranches: 'EmployerBranches',
  EmployerProfileRoot: 'EmployerProfile',
  EmployerFavoriteWorkers: 'EmployerProfile',
  SharedRatingsPending: 'EmployerProfile',
  SharedRatingsCompose: 'EmployerProfile',
  SharedAbuseReport: 'EmployerProfile',
};

export const MANAGER_SCREEN_TAB: Record<string, string> = {
  EmployerHome: 'ManagerHome',
  EmployerBranches: 'ManagerHome',
  EmployerJobsList: 'ManagerJobs',
  EmployerCreateJob: 'ManagerJobs',
  EmployerJobDetail: 'ManagerJobs',
  EmployerApplicants: 'ManagerJobs',
  EmployerVerificationStatus: 'ManagerJobs',
  SharedNotificationsList: 'ManagerAlerts',
  SharedNotificationDetail: 'ManagerAlerts',
  SharedNotificationPrefs: 'ManagerAlerts',
  EmployerProfileRoot: 'ManagerProfile',
  EmployerTokensRoot: 'ManagerProfile',
  EmployerTokenTopUp: 'ManagerProfile',
  EmployerOpenDisputes: 'ManagerProfile',
  EmployerShiftManualConfirm: 'ManagerProfile',
  EmployerFavoriteWorkers: 'ManagerProfile',
  SharedRatingsPending: 'ManagerProfile',
  SharedRatingsCompose: 'ManagerProfile',
  SharedAbuseReport: 'ManagerProfile',
};

type TabNavigation = {
  getParent: () =>
    | {
        getState: () => { routeNames: string[] } | undefined;
        navigate: (name: string, params?: object) => void;
      }
    | undefined;
  navigate: (name: string, params?: object) => void;
};

export function openInTab(
  navigation: TabNavigation,
  screen: string,
  tabs: readonly string[],
  params?: object,
): void {
  const parent = navigation.getParent();
  if (!parent) {
    navigation.navigate(screen, params);
    return;
  }
  const names = parent.getState()?.routeNames ?? [];
  const tab = tabs.find((name) => names.includes(name));
  if (!tab) {
    navigation.navigate(screen, params);
    return;
  }
  parent.navigate(tab, { screen, params });
}
