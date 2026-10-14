import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ShiftsService } from './shifts.service.js';

describe('ShiftsService Lifecycle & Substitute Engine', () => {
  let shiftsService: ShiftsService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockNotifications: any;
  let mockGeofence: any;
  let mockTokens: any;
  let mockRatings: any;
  let mockPlatform: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
      shift: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      application: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      applicationEvent: {
        create: vi.fn(),
      },
      shiftIncident: {
        create: vi.fn(),
      },
      riskEvent: {
        create: vi.fn(),
      },
      job: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      employerMembership: {
        findMany: vi.fn().mockResolvedValue([{ userId: 'owner-1' }]),
      },
      checkInDispute: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      branchManager: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      workplaceManager: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockConfig = {
      env: {
        AVAILABILITY_CONFIRM_HOURS: 3,
        AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES: 30,
      },
    };

    mockNotifications = {
      enqueueInTransaction: vi.fn().mockResolvedValue(undefined),
    };

    mockGeofence = {
      evaluate: vi.fn(),
      assertInsideOrSoft: vi.fn(),
    };

    mockTokens = {
      releasePartialHold: vi.fn().mockResolvedValue(undefined),
      captureForShift: vi.fn().mockResolvedValue(undefined),
    };

    mockRatings = {
      markAttendanceConfirmed: vi.fn().mockResolvedValue(undefined),
    };

    mockPlatform = {
      getPublicRemoteConfig: vi.fn().mockResolvedValue({
        checkinLateMinutes: 15,
        checkinEarlyMinutes: 15,
      }),
    };

    shiftsService = new ShiftsService(
      mockPrisma,
      mockConfig,
      mockNotifications,
      mockGeofence,
      mockTokens,
      mockRatings,
      mockPlatform,
    );
  });

  describe('promoteNextSubstitute', () => {
    it('returns null if there are no substitute applications on the bench', async () => {
      mockPrisma.application.findMany.mockResolvedValueOnce([]);

      const result = await shiftsService.promoteNextSubstitute(mockPrisma, 'job-1');
      expect(result).toBeNull();
      expect(mockPrisma.application.update).not.toHaveBeenCalled();
    });

    it('promotes the highest-ranked substitute candidate and creates a shift', async () => {
      const candidates = [
        {
          id: 'sub-1',
          jobId: 'job-1',
          workerUserId: 'worker-sub-1',
          workerProfile: {
            id: 'wp-1',
            firstName: 'Ali',
            lastName: 'Yılmaz',
            sectors: [{ sectorCode: 'gastronomy' }],
            occupations: [{ occupationCode: 'waiter' }],
            homeLatitude: 41.01,
            homeLongitude: 28.98,
          },
          job: {
            id: 'job-1',
            employerId: 'emp-1',
            branchId: 'branch-1',
            sectorCode: 'gastronomy',
            occupationCode: 'barista',
            title: 'Barista',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 4),
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
            employer: { id: 'emp-1', latitude: 41.0, longitude: 28.97 },
            branch: { id: 'branch-1', latitude: 41.0, longitude: 28.97, name: 'Kadıköy Şube' },
          },
        },
        {
          id: 'sub-2',
          jobId: 'job-1',
          workerUserId: 'worker-sub-2',
          workerProfile: {
            id: 'wp-2',
            firstName: 'Deniz',
            lastName: 'Kaya',
            sectors: [{ sectorCode: 'gastronomy' }],
            occupations: [{ occupationCode: 'barista' }], // Exact match!
            homeLatitude: 41.0,
            homeLongitude: 28.97,
          },
          job: {
            id: 'job-1',
            employerId: 'emp-1',
            branchId: 'branch-1',
            sectorCode: 'gastronomy',
            occupationCode: 'barista',
            title: 'Barista',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 4),
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
            employer: { id: 'emp-1', latitude: 41.0, longitude: 28.97 },
            branch: { id: 'branch-1', latitude: 41.0, longitude: 28.97, name: 'Kadıköy Şube' },
          },
        },
      ];

      mockPrisma.application.findMany.mockResolvedValueOnce(candidates);
      mockPrisma.shift.create.mockResolvedValueOnce({ id: 'new-promoted-shift-1' });

      const result = await shiftsService.promoteNextSubstitute(mockPrisma, 'job-1');

      expect(result).toBe('new-promoted-shift-1');
      // sub-2 has exact occupation match, so sub-2 should be chosen over sub-1
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'sub-2' },
        data: { status: 'accepted' },
      });
      expect(mockNotifications.enqueueInTransaction).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          userId: 'worker-sub-2',
          type: 'shift.substitute_promoted',
        }),
      );
    });
  });

  describe('releaseSeat cascading substitution', () => {
    it('does not increment remainingHeadcount if a substitute is promoted', async () => {
      vi.spyOn(shiftsService, 'promoteNextSubstitute').mockResolvedValueOnce('shift-sub-id');

      await shiftsService.releaseSeat(mockPrisma, 'job-1');

      expect(mockPrisma.job.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.job.update).not.toHaveBeenCalled();
    });

    it('increments remainingHeadcount if no substitute is available on the bench', async () => {
      vi.spyOn(shiftsService, 'promoteNextSubstitute').mockResolvedValueOnce(null);
      mockPrisma.job.findUnique.mockResolvedValueOnce({
        id: 'job-1',
        headcount: 5,
        remainingHeadcount: 2,
        status: 'published',
      });

      await shiftsService.releaseSeat(mockPrisma, 'job-1');

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { remainingHeadcount: 3, status: 'published' },
      });
    });
  });

  describe('checkOut early departure incident logging', () => {
    it('creates an early_departure incident when worker leaves >30 minutes early', async () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 1000 * 60 * 60 * 3);
      // Scheduled to end 2 hours from now, but worker checks out now (120 mins early)
      const scheduledEndsAt = new Date(now.getTime() + 1000 * 60 * 120);

      mockPrisma.shift.findUnique.mockResolvedValueOnce({
        id: 'shift-1',
        workerUserId: 'worker-1',
        employerId: 'emp-1',
        branchId: 'branch-1',
        status: 'checked_in',
        startsAt,
        endsAt: scheduledEndsAt,
        checkedInAt: startsAt,
        job: { id: 'job-1', title: 'Komi', sectorCode: 'gastronomy', employer: {} },
        branch: { id: 'branch-1' },
      });
      mockPrisma.shift.update.mockResolvedValueOnce({
        id: 'shift-1',
        applicationId: 'app-1',
        jobId: 'job-1',
        workerUserId: 'worker-1',
        employerId: 'emp-1',
        branchId: 'branch-1',
        status: 'completed',
        startsAt,
        endsAt: scheduledEndsAt,
        confirmOpensAt: startsAt,
        confirmDeadlineAt: startsAt,
        checkedInAt: startsAt,
        completedAt: now,
      });

      await shiftsService.checkOut('worker-1', 'shift-1', {});

      expect(mockPrisma.shiftIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shiftId: 'shift-1',
          workerUserId: 'worker-1',
          type: 'early_departure',
          severity: 'medium',
        }),
      });
      expect(mockNotifications.enqueueInTransaction).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          type: 'shift.worker_checked_out',
        }),
      );
    });
  });

  describe('processCheckInNoShows', () => {
    it('flags no-show workers whose late check-in window has elapsed', async () => {
      const now = new Date();
      // Shift started 30 mins ago, late threshold is 15 mins => No-show!
      const startsAt = new Date(now.getTime() - 1000 * 60 * 30);

      mockPrisma.shift.findMany.mockResolvedValueOnce([
        {
          id: 'shift-no-show-1',
          workerUserId: 'worker-late-1',
          jobId: 'job-1',
          employerId: 'emp-1',
          branchId: 'branch-1',
          status: 'can_come',
          startsAt,
          checkedInAt: null,
          job: { title: 'Garson', sectorCode: 'gastronomy' },
        },
      ]);
      mockPrisma.shift.findUnique.mockResolvedValueOnce({
        id: 'shift-no-show-1',
        status: 'can_come',
        checkedInAt: null,
      });

      const processed = await shiftsService.processCheckInNoShows();

      expect(processed).toBe(1);
      expect(mockPrisma.shift.update).toHaveBeenCalledWith({
        where: { id: 'shift-no-show-1' },
        data: { status: 'cannot_come' },
      });
      expect(mockPrisma.riskEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'worker-late-1',
          type: 'no_show',
          score: 5,
        }),
      });
      expect(mockPrisma.shiftIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'no_show',
          severity: 'high',
        }),
      });
    });
  });

  describe('reconcileStaleCheckedInShifts', () => {
    it('auto-completes checked-in shifts that ended over 2 hours ago without checkout', async () => {
      const now = new Date();
      // Shift ended 3 hours ago
      const endsAt = new Date(now.getTime() - 1000 * 60 * 60 * 3);

      mockPrisma.shift.findMany.mockResolvedValueOnce([
        {
          id: 'shift-stale-1',
          workerUserId: 'worker-1',
          jobId: 'job-1',
          employerId: 'emp-1',
          branchId: 'branch-1',
          status: 'checked_in',
          endsAt,
          job: { title: 'Barista', sectorCode: 'gastronomy' },
        },
      ]);
      mockPrisma.shift.findUnique.mockResolvedValueOnce({
        id: 'shift-stale-1',
        status: 'checked_in',
        endsAt,
      });

      const count = await shiftsService.reconcileStaleCheckedInShifts();

      expect(count).toBe(1);
      expect(mockPrisma.shift.update).toHaveBeenCalledWith({
        where: { id: 'shift-stale-1' },
        data: expect.objectContaining({
          status: 'completed',
          completedAt: endsAt,
        }),
      });
      expect(mockPrisma.shiftIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'system_auto_checkout',
          severity: 'low',
        }),
      });
    });
  });

  describe('rejectDispute', () => {
    it('rejects an open dispute and notifies the worker', async () => {
      mockPrisma.shift.findUnique.mockResolvedValueOnce({
        id: 'shift-1',
        workerUserId: 'worker-1',
        employerId: 'emp-1',
        branchId: 'branch-1',
        job: { title: 'Barista', sectorCode: 'gastronomy' },
        branch: null,
      });

      mockPrisma.checkInDispute.findUnique.mockResolvedValueOnce({
        id: 'disp-1',
        shiftId: 'shift-1',
        status: 'open',
        note: 'GPS hatası oldu',
      });

      mockPrisma.checkInDispute.update.mockResolvedValueOnce({
        id: 'disp-1',
        shiftId: 'shift-1',
        status: 'rejected',
        note: 'GPS hatası oldu',
        createdAt: new Date(),
      });

      const result = await shiftsService.rejectDispute(
        'emp-user-1',
        { role: 'employer', employerId: 'emp-1', branchIds: [] },
        'shift-1',
        'disp-1',
      );

      expect(result.status).toBe('rejected');
      expect(mockPrisma.checkInDispute.update).toHaveBeenCalledWith({
        where: { id: 'disp-1' },
        data: expect.objectContaining({
          status: 'rejected',
          resolvedByUserId: 'emp-user-1',
        }),
      });
      expect(mockNotifications.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'worker-1',
          type: 'shift.dispute_update',
        }),
      );
    });
  });

  describe('createIncident Safety Escalation', () => {
    it('creates a RiskEvent when incident severity is critical or high', async () => {
      mockPrisma.shift.findUnique.mockResolvedValueOnce({
        id: 'shift-1',
        workerUserId: 'worker-1',
        employerId: 'emp-1',
        branchId: 'branch-1',
        job: { title: 'Garson', sectorCode: 'gastronomy' },
      });

      mockPrisma.shiftIncident.create.mockResolvedValueOnce({
        id: 'inc-1',
        shiftId: 'shift-1',
        workerUserId: 'worker-1',
        type: 'harassment',
        severity: 'critical',
        note: 'Tehlikeli durum',
        createdAt: new Date(),
      });

      const result = await shiftsService.createIncident('worker-1', 'shift-1', {
        type: 'harassment',
        severity: 'critical',
        note: 'Tehlikeli durum',
      });

      expect(result.id).toBe('inc-1');
      expect(mockPrisma.riskEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'worker-1',
          shiftId: 'shift-1',
          type: 'incident.harassment.critical',
          score: 10,
        }),
      });
    });
  });
});

