import type { Shift } from '@parton/api-contracts';
import { useSyncExternalStore } from 'react';

let currentUrgentShift: Shift | null = null;
let dismissedShiftId: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Prioritizes active in-progress shifts first, then 3h-confirm open shifts,
 * then shifts starting within 3 hours.
 */
export function selectUrgentShift(shifts: Shift[], now = Date.now()): Shift | null {
  // 1. Any shift currently in progress (checked in)
  const inProgress = shifts.find(
    (s) => s.status === 'checked_in' || s.status === 'manual_confirmed',
  );
  if (inProgress) {
    return inProgress;
  }

  // 2. Any shift with active confirmation window
  const awaitingConfirm = shifts.find(
    (s) => s.confirmWindow?.isOpen || s.status === 'awaiting_confirm',
  );
  if (awaitingConfirm) {
    return awaitingConfirm;
  }

  // 3. Any shift starting within 3 hours (180 minutes)
  const upcomingReady = shifts
    .filter((s) => s.status === 'can_come' || s.status === 'scheduled')
    .filter((s) => {
      const ms = new Date(s.startsAt).getTime() - now;
      return ms > 0 && ms <= 3 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return upcomingReady[0] ?? null;
}

export function getActiveShift(): Shift | null {
  if (currentUrgentShift && currentUrgentShift.id === dismissedShiftId) {
    return null;
  }
  return currentUrgentShift;
}

export function setActiveShift(shift: Shift | null) {
  if (currentUrgentShift?.id !== shift?.id || currentUrgentShift?.status !== shift?.status) {
    currentUrgentShift = shift;
    if (shift && shift.id !== dismissedShiftId) {
      dismissedShiftId = null;
    }
    emit();
  }
}

export function dismissActiveShift(shiftId: string) {
  dismissedShiftId = shiftId;
  emit();
}

export function clearActiveShift() {
  currentUrgentShift = null;
  dismissedShiftId = null;
  emit();
}

export function useActiveShift(): Shift | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    getActiveShift,
    getActiveShift,
  );
}
