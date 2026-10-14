import { describe, expect, it } from 'vitest';
import {
  executeShiftSwap,
  validateCandidateForSwap,
  validateSwapEligibility,
  type SwapCandidateWorker,
  type SwapShift,
} from './shift-swap.util.js';

describe('shift-swap.util', () => {
  const baseShift: SwapShift = {
    id: 'shift-100',
    workerUserId: 'worker-proposer',
    status: 'scheduled',
    startsAt: new Date('2026-10-15T18:00:00Z'),
    endsAt: new Date('2026-10-15T23:00:00Z'),
    requiredOccupationCode: 'barista',
  };

  const qualifiedCandidate: SwapCandidateWorker = {
    userId: 'worker-peer',
    displayName: 'Zeynep K.',
    reliabilityScore: 92,
    occupationCodes: ['barista', 'cashier'],
    existingShifts: [],
  };

  describe('validateSwapEligibility', () => {
    it('approves scheduled shift with > 4 hours lead time', () => {
      const now = new Date('2026-10-15T10:00:00Z'); // 8 hours before
      const result = validateSwapEligibility(baseShift, now);
      expect(result.eligible).toBe(true);
    });

    it('rejects shift with less than 4 hours lead time', () => {
      const now = new Date('2026-10-15T15:30:00Z'); // 2.5 hours before
      const result = validateSwapEligibility(baseShift, now);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_LEAD_TIME');
    });

    it('rejects shift with ineligible status', () => {
      const now = new Date('2026-10-15T10:00:00Z');
      const inProgressShift: SwapShift = { ...baseShift, status: 'checked_in' };
      const result = validateSwapEligibility(inProgressShift, now);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('INVALID_SHIFT_STATUS');
    });
  });

  describe('validateCandidateForSwap', () => {
    it('approves a qualified candidate with no conflicts', () => {
      const result = validateCandidateForSwap(baseShift, qualifiedCandidate);
      expect(result.eligible).toBe(true);
    });

    it('rejects candidate missing the required occupation', () => {
      const unqualified = {
        ...qualifiedCandidate,
        occupationCodes: ['chef'],
      };
      const result = validateCandidateForSwap(baseShift, unqualified);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('OCCUPATION_MISMATCH');
    });

    it('rejects candidate with low reliability score', () => {
      const lowReliability = {
        ...qualifiedCandidate,
        reliabilityScore: 68,
      };
      const result = validateCandidateForSwap(baseShift, lowReliability);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('RELIABILITY_TOO_LOW');
    });

    it('detects direct overlapping shifts', () => {
      const overlappingCandidate: SwapCandidateWorker = {
        ...qualifiedCandidate,
        existingShifts: [
          {
            id: 'shift-conflict',
            startsAt: new Date('2026-10-15T19:00:00Z'),
            endsAt: new Date('2026-10-16T00:00:00Z'),
          },
        ],
      };
      const result = validateCandidateForSwap(baseShift, overlappingCandidate);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('OVERLAPPING_SHIFT');
    });

    it('enforces 11-hour statutory rest window between shifts', () => {
      // Prior shift ends at 10:00 AM, target shift starts at 18:00 PM (8h rest < 11h required)
      const restViolator: SwapCandidateWorker = {
        ...qualifiedCandidate,
        existingShifts: [
          {
            id: 'shift-morning',
            startsAt: new Date('2026-10-15T02:00:00Z'),
            endsAt: new Date('2026-10-15T10:00:00Z'),
          },
        ],
      };
      const result = validateCandidateForSwap(baseShift, restViolator);
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('REST_WINDOW_VIOLATION');
    });
  });

  describe('executeShiftSwap', () => {
    it('executes atomic transfer when all criteria pass', () => {
      const now = new Date('2026-10-15T10:00:00Z');
      const transfer = executeShiftSwap(baseShift, qualifiedCandidate, now);

      expect(transfer.success).toBe(true);
      expect(transfer.shiftId).toBe('shift-100');
      expect(transfer.originalWorkerUserId).toBe('worker-proposer');
      expect(transfer.newWorkerUserId).toBe('worker-peer');
      expect(transfer.swappedAt).toBe(now.toISOString());
    });

    it('blocks transfer and preserves original worker on validation failure', () => {
      const now = new Date('2026-10-15T17:00:00Z'); // Only 1 hour before
      const transfer = executeShiftSwap(baseShift, qualifiedCandidate, now);

      expect(transfer.success).toBe(false);
      expect(transfer.originalWorkerUserId).toBe('worker-proposer');
      expect(transfer.reason).toContain('at least 4 hours notice');
    });
  });
});
