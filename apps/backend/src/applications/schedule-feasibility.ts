import { haversineDistanceKm } from './candidate-ranking.util.js';

export interface ShiftIntervalWithLocation {
  id: string;
  jobId: string;
  startsAt: Date;
  endsAt: Date;
  latitude?: number | null;
  longitude?: number | null;
  title?: string | null;
}

export interface TransitConflictResult {
  hasConflict: boolean;
  type?: 'temporal_overlap' | 'transit_infeasible';
  conflictingShiftId?: string;
  requiredTransitMinutes?: number;
  availableMinutes?: number;
  distanceKm?: number;
  message?: string;
}

/**
 * Calculates realistic urban transit buffer time in minutes based on distance.
 * Istanbul / urban transit baseline: average transit speed ~25 km/h + 15 min buffer.
 */
export function calculateRequiredTransitMinutes(distanceKm: number): number {
  if (distanceKm <= 1.0) {
    return 15;
  }
  const travelMinutes = (distanceKm / 25) * 60;
  return Math.min(120, Math.max(15, Math.round(travelMinutes + 15)));
}

/**
 * Checks two shift intervals for temporal overlap or transit infeasibility.
 */
export function evaluateShiftFeasibility(
  shiftA: ShiftIntervalWithLocation,
  shiftB: ShiftIntervalWithLocation,
): TransitConflictResult {
  const aStart = shiftA.startsAt.getTime();
  const aEnd = shiftA.endsAt.getTime();
  const bStart = shiftB.startsAt.getTime();
  const bEnd = shiftB.endsAt.getTime();

  // 1. Strict temporal overlap
  if (aStart < bEnd && bStart < aEnd) {
    return {
      hasConflict: true,
      type: 'temporal_overlap',
      conflictingShiftId: shiftB.id,
      message: 'Vardiya saatleri birbiriyle çakışıyor.',
    };
  }

  // 2. Geographic transit feasibility
  if (
    shiftA.latitude != null &&
    shiftA.longitude != null &&
    shiftB.latitude != null &&
    shiftB.longitude != null
  ) {
    const distKm = haversineDistanceKm(
      shiftA.latitude,
      shiftA.longitude,
      shiftB.latitude,
      shiftB.longitude,
    );
    const requiredTransit = calculateRequiredTransitMinutes(distKm);

    if (aEnd <= bStart) {
      const gapMinutes = (bStart - aEnd) / (1000 * 60);
      if (gapMinutes < requiredTransit) {
        return {
          hasConflict: true,
          type: 'transit_infeasible',
          conflictingShiftId: shiftB.id,
          distanceKm: Number(distKm.toFixed(1)),
          requiredTransitMinutes: requiredTransit,
          availableMinutes: Math.round(gapMinutes),
          message: `${distKm.toFixed(1)} km mesafe için tahmini ulaşım süresi ${requiredTransit} dk, kalan süre ise yalnızca ${Math.round(gapMinutes)} dk.`,
        };
      }
    } else if (bEnd <= aStart) {
      const gapMinutes = (aStart - bEnd) / (1000 * 60);
      if (gapMinutes < requiredTransit) {
        return {
          hasConflict: true,
          type: 'transit_infeasible',
          conflictingShiftId: shiftB.id,
          distanceKm: Number(distKm.toFixed(1)),
          requiredTransitMinutes: requiredTransit,
          availableMinutes: Math.round(gapMinutes),
          message: `${distKm.toFixed(1)} km mesafe için tahmini ulaşım süresi ${requiredTransit} dk, kalan süre ise yalnızca ${Math.round(gapMinutes)} dk.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Sweep-Line schedule feasibility validator.
 * Validates a collection of N shifts in O(N log N) time,
 * checking for both cascading transit conflicts and tight turnaround infeasibility.
 */
export function validateScheduleSweepLine(
  shifts: ShiftIntervalWithLocation[],
): TransitConflictResult[] {
  if (shifts.length <= 1) {
    return [];
  }

  const sorted = [...shifts].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  const conflicts: TransitConflictResult[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const conflict = evaluateShiftFeasibility(current, next);
    if (conflict.hasConflict) {
      conflicts.push(conflict);
    }
  }

  return conflicts;
}
