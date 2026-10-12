export type EmployerStackParamList = {
  EmployerHome: { screenId?: string } | undefined;
  EmployerBranches: { screenId?: string } | undefined;
  EmployerBranchDetail: { branchId: string };
  EmployerBranchForm: { branchId?: string } | undefined;
  EmployerProfileRoot: { screenId?: string } | undefined;
  EmployerJobsList: undefined;
  EmployerJobDetail: { jobId: string };
  EmployerCreateJob: undefined;
  EmployerApplicants: {
    jobId: string;
    jobTitle?: string | null;
    filter?: 'pending' | 'accepted' | 'substitute' | 'rejected';
  };
  EmployerApplicantDetail: { applicationId: string; jobTitle?: string | null };
  EmployerFavoriteWorkers: undefined;
  EmployerVerificationStatus: undefined;
  EmployerOpenDisputes: undefined;
  EmployerTokensRoot: undefined;
  EmployerTokenTopUp: undefined;
  EmployerDashboard: undefined;
  EmployerCalendar: undefined;
  EmployerBusiness: undefined;
  EmployerIndustry: undefined;
  EmployerChecklist: undefined;
  EmployerOpsSettings: undefined;
  EmployerShiftManualConfirm: {
    shiftId: string;
    jobTitle?: string | null;
    workerDisplayName?: string | null;
    disputeNote?: string;
  };
  SharedAbuseReport: { targetUserId?: string } | undefined;
  SharedSupportRequest: undefined;
  SharedSettings: undefined;
  SharedAccountEmail: undefined;
  SharedJobProcess: { applicationId: string };
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
