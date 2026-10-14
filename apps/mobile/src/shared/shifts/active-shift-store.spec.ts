import type { Shift } from '@parton/api-contracts';
import {
  clearActiveShift,
  dismissActiveShift,
  getActiveShift,
  selectUrgentShift,
  setActiveShift,
} from './active-shift-store';

function createMockShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    jobId: 'job-1',
    branchId: 'branch-1',
    jobTitle: 'Garson',
    branchName: 'Kadıköy Şube',
    branchLatitude: 40.99,
    branchLongitude: 29.02,
    startsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    payAmount: 1200,
    currency: 'TRY',
    status: 'can_come',
    checkInWindowMinutes: 30,
    checkInMethod: 'qr_and_geofence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Shift;
}

describe('active-shift-store', () => {
  beforeEach(() => {
    clearActiveShift();
  });

  describe('selectUrgentShift', () => {
    const now = new Date('2026-10-14T12:00:00.000Z').getTime();

    it('prioritizes checked_in shifts above all others', () => {
      const shift1 = createMockShift({
        id: 's1',
        status: 'awaiting_confirm',
        confirmWindow: {
          isOpen: true,
          opensAt: '2026-10-14T10:00:00.000Z',
          deadlineAt: '2026-10-14T13:00:00.000Z',
        },
      });
      const shift2 = createMockShift({ id: 's2', status: 'checked_in' });

      const urgent = selectUrgentShift([shift1, shift2], now);
      expect(urgent?.id).toBe('s2');
    });

    it('selects open confirmation window shifts when no active checked_in shift exists', () => {
      const shift1 = createMockShift({
        id: 's1',
        status: 'awaiting_confirm',
        confirmWindow: {
          isOpen: true,
          opensAt: '2026-10-14T10:00:00.000Z',
          deadlineAt: '2026-10-14T13:00:00.000Z',
        },
      });
      const shift2 = createMockShift({
        id: 's2',
        status: 'can_come',
        startsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      });

      const urgent = selectUrgentShift([shift1, shift2], now);
      expect(urgent?.id).toBe('s1');
    });

    it('selects upcoming shifts within T-3h window sorted by startsAt ascending', () => {
      const shiftFar = createMockShift({
        id: 's-far',
        startsAt: new Date(now + 5 * 60 * 60 * 1000).toISOString(),
      });
      const shiftNear = createMockShift({
        id: 's-near',
        startsAt: new Date(now + 45 * 60 * 1000).toISOString(),
      });
      const shiftMiddle = createMockShift({
        id: 's-middle',
        startsAt: new Date(now + 90 * 60 * 1000).toISOString(),
      });

      const urgent = selectUrgentShift([shiftFar, shiftMiddle, shiftNear], now);
      expect(urgent?.id).toBe('s-near');
    });

    it('returns null when all shifts are beyond 3 hours or completed', () => {
      const shiftFar = createMockShift({
        id: 's-far',
        startsAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      });
      const shiftDone = createMockShift({ id: 's-done', status: 'completed' });

      const urgent = selectUrgentShift([shiftFar, shiftDone], now);
      expect(urgent).toBeNull();
    });
  });

  describe('store reactivity and dismissal', () => {
    it('sets and retrieves active shift', () => {
      const shift = createMockShift({ id: 'shift-99' });
      setActiveShift(shift);
      expect(getActiveShift()?.id).toBe('shift-99');
    });

    it('hides shift when dismissed by id', () => {
      const shift = createMockShift({ id: 'shift-99' });
      setActiveShift(shift);
      expect(getActiveShift()?.id).toBe('shift-99');

      dismissActiveShift('shift-99');
      expect(getActiveShift()).toBeNull();

      // Setting a new shift unhides
      const newShift = createMockShift({ id: 'shift-100' });
      setActiveShift(newShift);
      expect(getActiveShift()?.id).toBe('shift-100');
    });
  });
});
