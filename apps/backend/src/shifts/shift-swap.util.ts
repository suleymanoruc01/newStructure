/**
 * Worker Shift Swap & Peer Trade System.
 *
 * Enables confirmed workers to hand off upcoming shifts to qualified peers without
 * incurring cancellation penalties or jeopardizing employer staffing quotas.
 * Enforces Turkish Labor Law statutory 11-hour rest windows, qualification parity,
 * and minimum lead time bounds.
 */

export const MIN_SWAP_LEAD_HOURS = 4;
export const STATUTORY_REST_WINDOW_HOURS = 11;
export const MIN_SWAP_RELIABILITY_PERCENT = 75;

export type SwapShift = {
  id: string;
  workerUserId: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  requiredOccupationCode?: string;
};

export type SwapCandidateWorker = {
  userId: string;
  displayName: string;
  reliabilityScore: number;
  occupationCodes: string[];
  existingShifts: {
    id: string;
    startsAt: Date;
    endsAt: Date;
  }[];
};

export type ShiftSwapValidationResult = {
  eligible: boolean;
  code?:
    | 'INSUFFICIENT_LEAD_TIME'
    | 'INVALID_SHIFT_STATUS'
    | 'OCCUPATION_MISMATCH'
    | 'RELIABILITY_TOO_LOW'
    | 'OVERLAPPING_SHIFT'
    | 'REST_WINDOW_VIOLATION';
  message?: string;
};

export type ShiftSwapTransferResult = {
  success: boolean;
  shiftId: string;
  originalWorkerUserId: string;
  newWorkerUserId: string;
  swappedAt: string;
  reason?: string;
};

/**
 * Validates whether a shift is eligible to be swapped by its current worker.
 */
export function validateSwapEligibility(
  shift: SwapShift,
  now: Date = new Date(),
): ShiftSwapValidationResult {
  const allowedStatuses = ['scheduled', 'accepted', 'assigned'];
  if (!allowedStatuses.includes(shift.status)) {
    return {
      eligible: false,
      code: 'INVALID_SHIFT_STATUS',
      message: `Shift status "${shift.status}" is not eligible for peer swap.`,
    };
  }

  const hoursUntilStart = (shift.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilStart < MIN_SWAP_LEAD_HOURS) {
    return {
      eligible: false,
      code: 'INSUFFICIENT_LEAD_TIME',
      message: `Shift swaps require at least ${MIN_SWAP_LEAD_HOURS} hours notice prior to start.`,
    };
  }

  return { eligible: true };
}

/**
 * Checks whether the incoming candidate satisfies rest windows and no schedule overlaps.
 */
export function validateCandidateForSwap(
  shift: SwapShift,
  candidate: SwapCandidateWorker,
): ShiftSwapValidationResult {
  // 1. Occupation qualification check
  if (
    shift.requiredOccupationCode &&
    !candidate.occupationCodes.includes(shift.requiredOccupationCode)
  ) {
    return {
      eligible: false,
      code: 'OCCUPATION_MISMATCH',
      message: 'Candidate does not hold required occupation certificate/qualification.',
    };
  }

  // 2. Minimum reliability score
  if (candidate.reliabilityScore < MIN_SWAP_RELIABILITY_PERCENT) {
    return {
      eligible: false,
      code: 'RELIABILITY_TOO_LOW',
      message: `Candidate reliability (${candidate.reliabilityScore}%) is below minimum threshold (${MIN_SWAP_RELIABILITY_PERCENT}%).`,
    };
  }

  const shiftStartMs = shift.startsAt.getTime();
  const shiftEndMs = shift.endsAt.getTime();
  const restWindowMs = STATUTORY_REST_WINDOW_HOURS * 60 * 60 * 1000;

  for (const existing of candidate.existingShifts) {
    const existStartMs = existing.startsAt.getTime();
    const existEndMs = existing.endsAt.getTime();

    // Check direct time overlap
    if (shiftStartMs < existEndMs && shiftEndMs > existStartMs) {
      return {
        eligible: false,
        code: 'OVERLAPPING_SHIFT',
        message: 'Candidate has an overlapping shift scheduled during this timeframe.',
      };
    }

    // Check 11-hour statutory rest window before or after
    if (existEndMs <= shiftStartMs) {
      const restBeforeMs = shiftStartMs - existEndMs;
      if (restBeforeMs < restWindowMs) {
        return {
          eligible: false,
          code: 'REST_WINDOW_VIOLATION',
          message: `Mandatory ${STATUTORY_REST_WINDOW_HOURS}h rest period not met before this shift.`,
        };
      }
    }

    if (shiftEndMs <= existStartMs) {
      const restAfterMs = existStartMs - shiftEndMs;
      if (restAfterMs < restWindowMs) {
        return {
          eligible: false,
          code: 'REST_WINDOW_VIOLATION',
          message: `Mandatory ${STATUTORY_REST_WINDOW_HOURS}h rest period not met after this shift.`,
        };
      }
    }
  }

  return { eligible: true };
}

/**
 * Computes an atomic shift swap transfer payload.
 */
export function executeShiftSwap(
  shift: SwapShift,
  candidate: SwapCandidateWorker,
  now: Date = new Date(),
): ShiftSwapTransferResult {
  const eligibility = validateSwapEligibility(shift, now);
  if (!eligibility.eligible) {
    return {
      success: false,
      shiftId: shift.id,
      originalWorkerUserId: shift.workerUserId,
      newWorkerUserId: candidate.userId,
      swappedAt: now.toISOString(),
      reason: eligibility.message,
    };
  }

  const candidateCheck = validateCandidateForSwap(shift, candidate);
  if (!candidateCheck.eligible) {
    return {
      success: false,
      shiftId: shift.id,
      originalWorkerUserId: shift.workerUserId,
      newWorkerUserId: candidate.userId,
      swappedAt: now.toISOString(),
      reason: candidateCheck.message,
    };
  }

  return {
    success: true,
    shiftId: shift.id,
    originalWorkerUserId: shift.workerUserId,
    newWorkerUserId: candidate.userId,
    swappedAt: now.toISOString(),
  };
}
