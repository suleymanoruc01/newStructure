import {
  notificationTarget,
  parseAppPath,
  pickRoute,
} from './deep-link';

const worker = [
  'WorkerJobDetail',
  'WorkerShiftAvailability',
  'WorkerShiftCheckIn',
  'WorkerShiftInShift',
  'WorkerShiftDispute',
  'SharedRatingsCompose',
  'SharedNotificationDetail',
];

const employer = [
  'EmployerApplicants',
  'EmployerJobDetail',
  'EmployerShiftManualConfirm',
  'EmployerFavoriteWorkers',
  'SharedRatingsCompose',
  'SharedNotificationDetail',
];

describe('notificationTarget', () => {
  it('opens the worker job for a match', () => {
    const target = notificationTarget('job.matched', { jobId: 'j1' });
    expect(pickRoute(target!, worker)?.name).toBe('WorkerJobDetail');
    expect(pickRoute(target!, employer)).toBeNull();
  });

  it('opens applicants for the employer and the confirm screen for the worker', () => {
    const target = notificationTarget('shift.confirm_timeout', {
      jobId: 'j1',
      shiftId: 's1',
    });
    expect(pickRoute(target!, employer)?.name).toBe('EmployerApplicants');
    expect(pickRoute(target!, worker)?.name).toBe('WorkerShiftAvailability');
  });

  it('sends a dispute to the screen this role actually has', () => {
    const target = notificationTarget('shift.dispute_update', { shiftId: 's1' });
    expect(pickRoute(target!, worker)?.name).toBe('WorkerShiftDispute');
    expect(pickRoute(target!, employer)?.name).toBe('EmployerShiftManualConfirm');
  });

  it('leaves unknown types on the inbox', () => {
    expect(notificationTarget('admin.broadcast', { jobId: 'j1' })).toBeNull();
  });

  it('does not throw when the payload is missing', () => {
    expect(notificationTarget('job.matched', undefined)).toBeNull();
  });
});

describe('parseAppPath', () => {
  it('reads the documented app paths', () => {
    expect(parseAppPath('app/jobs/j1')?.primary).toEqual({
      name: 'WorkerJobDetail',
      params: { jobId: 'j1' },
    });
    expect(parseAppPath('/app/shifts/s1/check-in')?.primary.name).toBe(
      'WorkerShiftCheckIn',
    );
    expect(parseAppPath('app/employer/jobs/j1/applicants')?.primary.name).toBe(
      'EmployerApplicants',
    );
    expect(parseAppPath('auth/phone')).toBeNull();
  });
});
