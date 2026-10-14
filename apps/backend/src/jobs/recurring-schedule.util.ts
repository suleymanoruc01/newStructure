/**
 * Multi-Branch Recurring Shift Matrix Generator.
 *
 * Enables enterprise multi-location employers (restaurant chains, retail networks,
 * event venues) to generate recurring shift schedules across multiple branches
 * with day-of-week recurrence rules, overnight shift boundary handling,
 * and automated token budget calculation.
 */

import {
  optimizeTokenBundle,
  type AvailablePackage,
} from '../tokens/token-bundle-optimizer.util.js';

export type RecurringScheduleTemplate = {
  jobTitle: string;
  branchIds: string[];
  occupationCode: string;
  requiredHeadcountPerBranch: number;
  startTimeLocal: string; // 'HH:mm', e.g. '18:00'
  endTimeLocal: string; // 'HH:mm', e.g. '02:00' (overnight supported)
  baseHourlyRateTry: number;
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
};

export type GeneratedShiftOccurrence = {
  branchId: string;
  jobTitle: string;
  occupationCode: string;
  headcount: number;
  startsAt: string; // ISO UTC
  endsAt: string; // ISO UTC
  durationHours: number;
  totalCostTry: number;
  dateKey: string; // 'YYYY-MM-DD'
};

export type RecurringMatrixResult = {
  totalOccurrences: number;
  totalShiftSeats: number;
  totalLaborBudgetTry: number;
  occurrences: GeneratedShiftOccurrence[];
  tokenOptimization?: {
    requiredTokens: number;
    optimalCostTry: number;
    recommendedPackages: { packageId: string; quantity: number }[];
  };
};

/**
 * Parses 'HH:mm' string into minutes since midnight.
 */
export function parseLocalTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    throw new Error(`Invalid time format: ${timeStr}. Expected "HH:mm".`);
  }
  return parts[0] * 60 + parts[1];
}

/**
 * Generates all shift occurrences across branches and dates based on recurrence rules.
 */
export function generateRecurringShiftMatrix(
  template: RecurringScheduleTemplate,
  options: {
    startDateIso: string; // 'YYYY-MM-DD'
    weeksCount: number;
    excludedDateKeys?: string[];
    availableTokenPackages?: AvailablePackage[];
  },
): RecurringMatrixResult {
  const { startDateIso, weeksCount, excludedDateKeys = [], availableTokenPackages } = options;

  if (weeksCount <= 0 || weeksCount > 12) {
    throw new Error('weeksCount must be between 1 and 12.');
  }
  if (template.branchIds.length === 0) {
    throw new Error('At least one branchId must be specified.');
  }
  if (template.daysOfWeek.length === 0) {
    throw new Error('At least one day of week must be specified.');
  }

  const startMinutes = parseLocalTimeToMinutes(template.startTimeLocal);
  const endMinutes = parseLocalTimeToMinutes(template.endTimeLocal);

  // Calculate duration in hours, supporting overnight shifts
  const durationMinutes =
    endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : 24 * 60 - startMinutes + endMinutes;
  const durationHours = Number((durationMinutes / 60).toFixed(2));

  if (durationHours <= 0) {
    throw new Error('Shift duration must be greater than 0.');
  }

  const shiftCostPerSeat = Math.round(durationHours * template.baseHourlyRateTry);
  const shiftCostPerOccurrence = shiftCostPerSeat * template.requiredHeadcountPerBranch;

  const excludedSet = new Set(excludedDateKeys);
  const occurrences: GeneratedShiftOccurrence[] = [];

  const [year, month, day] = startDateIso.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const totalDays = weeksCount * 7;

  for (let offset = 0; offset < totalDays; offset++) {
    const current = new Date(baseDate.getTime() + offset * 24 * 60 * 60 * 1000);
    const dayOfWeek = current.getUTCDay();

    if (!template.daysOfWeek.includes(dayOfWeek)) {
      continue;
    }

    const dateKey = current.toISOString().slice(0, 10);
    if (excludedSet.has(dateKey)) {
      continue;
    }

    // Compute UTC start and end ISO strings
    // Note: Assuming Istanbul UTC+3 civil time (+180 mins)
    const shiftStartUtcMs =
      current.getTime() + (startMinutes - 180) * 60 * 1000;
    const shiftEndUtcMs = shiftStartUtcMs + durationMinutes * 60 * 1000;

    const startsAtIso = new Date(shiftStartUtcMs).toISOString();
    const endsAtIso = new Date(shiftEndUtcMs).toISOString();

    for (const branchId of template.branchIds) {
      occurrences.push({
        branchId,
        jobTitle: template.jobTitle,
        occupationCode: template.occupationCode,
        headcount: template.requiredHeadcountPerBranch,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        durationHours,
        totalCostTry: shiftCostPerOccurrence,
        dateKey,
      });
    }
  }

  const totalOccurrences = occurrences.length;
  const totalShiftSeats = totalOccurrences * template.requiredHeadcountPerBranch;
  const totalLaborBudgetTry = totalOccurrences * shiftCostPerOccurrence;

  let tokenOptimization;
  if (availableTokenPackages && availableTokenPackages.length > 0) {
    const knapsack = optimizeTokenBundle(totalShiftSeats, availableTokenPackages);
    tokenOptimization = {
      requiredTokens: totalShiftSeats,
      optimalCostTry: knapsack.optimalCostTry,
      recommendedPackages: knapsack.bundle.map((p) => ({
        packageId: p.packageId,
        quantity: p.quantity,
      })),
    };
  }

  return {
    totalOccurrences,
    totalShiftSeats,
    totalLaborBudgetTry,
    occurrences,
    tokenOptimization,
  };
}
