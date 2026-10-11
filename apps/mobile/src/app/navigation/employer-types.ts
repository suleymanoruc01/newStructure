export type EmployerStackParamList = {
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
  SharedRatingsPending: undefined;
  SharedRatingsCompose: {
    shiftId: string;
    counterpartLabel: string;
    jobTitle?: string | null;
  };
};
