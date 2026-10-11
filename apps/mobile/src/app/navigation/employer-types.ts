export type EmployerStackParamList = {
  EmployerHome: { screenId?: string } | undefined;
  EmployerBranches: { screenId?: string } | undefined;
  EmployerProfileRoot: { screenId?: string } | undefined;
  EmployerJobsList: undefined;
  EmployerJobDetail: { jobId: string };
  EmployerCreateJob: undefined;
  EmployerApplicants: { jobId: string; jobTitle?: string | null };
  EmployerFavoriteWorkers: undefined;
  EmployerVerificationStatus: undefined;
  EmployerOpenDisputes: undefined;
  EmployerTokensRoot: undefined;
  EmployerTokenTopUp: undefined;
  EmployerShiftManualConfirm: {
    shiftId: string;
    jobTitle?: string | null;
    workerDisplayName?: string | null;
    disputeNote?: string;
  };
  SharedAbuseReport: { targetUserId?: string } | undefined;
  SharedNotificationsList: undefined;
  SharedNotificationDetail: { notificationId: string };
  SharedNotificationPrefs: undefined;
  SharedRatingsPending: undefined;
  SharedRatingsCompose: {
    shiftId: string;
    counterpartLabel: string;
    jobTitle?: string | null;
  };
};
