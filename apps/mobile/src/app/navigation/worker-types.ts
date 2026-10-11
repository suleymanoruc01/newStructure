export type WorkerStackParamList = {
  WorkerHome: undefined;
  WorkerCalendar: undefined;
  WorkerJobsList: undefined;
  WorkerApplicationsList: undefined;
  WorkerFavoritesList: undefined;
  WorkerAvailabilityEdit: undefined;
  WorkerProfileRoot: undefined;
  WorkerProfileEdit: undefined;
  WorkerDocumentsList: undefined;
  WorkerDocumentsUpload: undefined;
  WorkerJobDetail: { jobId: string };
  WorkerJobApply: { jobId: string };
  WorkerShiftAvailability: { shiftId: string };
  WorkerShiftCheckIn: { shiftId: string };
  WorkerShiftInShift: { shiftId: string };
  WorkerShiftCheckOut: { shiftId: string };
  WorkerShiftDispute: { shiftId: string };
  SharedRatingsPending: undefined;
  SharedAbuseReport: { targetUserId?: string } | undefined;
  SharedNotificationsList: undefined;
  SharedNotificationDetail: { notificationId: string };
  SharedNotificationPrefs: undefined;
  SharedRatingsCompose: {
    shiftId: string;
    counterpartLabel: string;
    jobTitle?: string | null;
  };
};
