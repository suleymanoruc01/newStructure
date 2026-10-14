/**
 * Spatiotemporal Shift Surge Pricing & Supply Elasticity Model.
 *
 * Implements dynamic surge multipliers and logistic fill-probability estimation
 * for urgent and off-peak shifts based on:
 * 1. Time-to-start exponential urgency decay
 * 2. Unfilled headcount capacity ratio
 * 3. Night-shift (20:00 - 06:00) and weekend supply scarcity coefficients
 * 4. Inverse logistic wage solver for target staffing confidence
 */

import { ISTANBUL_TIME_ZONE, istanbulCivil } from '../common/istanbul-civil.js';

export type UrgencyTier = 'nominal' | 'elevated' | 'high_urgency' | 'critical_surge';

export type SurgeInput = {
  startsAt: Date;
  endsAt: Date;
  headcount: number;
  remainingHeadcount: number;
  basePayAmountMinor?: number | null;
  asOfDate?: Date;
  timeZone?: string;
};

export type SurgePricingResult = {
  surgeMultiplier: number; // e.g. 1.25 (range: 1.00 - 1.75)
  urgencyTier: UrgencyTier;
  hoursUntilStart: number;
  vacancyRatio: number;
  nightFraction: number;
  isWeekend: boolean;
  basePayMinor: number | null;
  recommendedPayMinor: number | null;
  estimatedFillProbability: number; // [0.05, 0.99]
  suggestedMultiplierForTarget: (targetConfidence: number) => number;
};

// Calibrated logistic elasticity coefficients for Turkish gig shifts
const ELASTICITY = {
  beta0: 0.2, // Base log-odds with normal lead time
  beta1: 4.5, // Multiplier sensitivity (supply curve elasticity)
  beta2: 0.8, // Log-hours lead time benefit
  beta3: 1.2, // Vacancy ratio friction penalty
  maxMultiplier: 1.75,
  minMultiplier: 1.0,
  horizonHours: 24.0, // Urgency calculation window
} as const;

/**
 * Calculates what fraction of the shift interval [startsAt, endsAt]
 * falls within Turkish statutory night work hours (20:00 - 06:00).
 */
export function calculateNightWorkFraction(
  startsAt: Date,
  endsAt: Date,
  timeZone: string = ISTANBUL_TIME_ZONE,
): number {
  const startMs = startsAt.getTime();
  const endMs = endsAt.getTime();
  if (endMs <= startMs) return 0;

  const totalDurationMinutes = (endMs - startMs) / 60000;
  if (totalDurationMinutes <= 0) return 0;

  // Sample every 15 minutes or 1 minute for exact breakdown
  const stepMinutes = Math.min(15, Math.max(1, Math.floor(totalDurationMinutes / 20)));
  let nightMinutes = 0;

  for (let t = startMs; t < endMs; t += stepMinutes * 60000) {
    const chunkEnd = Math.min(endMs, t + stepMinutes * 60000);
    const chunkDuration = (chunkEnd - t) / 60000;
    const civil = istanbulCivil(new Date(t), timeZone);
    const hour = Math.floor(civil.minutes / 60);
    // Night hours in Turkey: 20:00 (inclusive) to 06:00 (exclusive)
    const isNight = hour >= 20 || hour < 6;
    if (isNight) {
      nightMinutes += chunkDuration;
    }
  }

  return Math.min(1.0, Math.max(0.0, nightMinutes / totalDurationMinutes));
}

/**
 * Checks whether the shift starts on a weekend (Saturday or Sunday in local time).
 */
export function isWeekendShift(
  startsAt: Date,
  timeZone: string = ISTANBUL_TIME_ZONE,
): boolean {
  const civil = istanbulCivil(startsAt, timeZone);
  return civil.weekday === 0 || civil.weekday === 6;
}

/**
 * Computes logistic fill probability P_fill given wage multiplier, time remaining, and vacancy ratio.
 */
export function computeFillProbability(
  multiplier: number,
  hoursUntilStart: number,
  vacancyRatio: number,
): number {
  const effectiveHours = Math.max(0, hoursUntilStart);
  const logTime = Math.log(1 + effectiveHours);
  const premium = Math.max(0, multiplier - 1.0);

  const z =
    ELASTICITY.beta0 +
    ELASTICITY.beta1 * premium +
    ELASTICITY.beta2 * logTime -
    ELASTICITY.beta3 * vacancyRatio;

  const p = 1 / (1 + Math.exp(-z));
  return Math.min(0.99, Math.max(0.05, Math.round(p * 100) / 100));
}

/**
 * Inverts the logistic function to solve for the wage multiplier M* required
 * to achieve a desired fill probability target P* (e.g., 0.90 for 90%).
 */
export function solveMultiplierForConfidence(
  targetConfidence: number,
  hoursUntilStart: number,
  vacancyRatio: number,
): number {
  const clampedTarget = Math.min(0.98, Math.max(0.1, targetConfidence));
  const targetZ = Math.log(clampedTarget / (1 - clampedTarget));
  const effectiveHours = Math.max(0, hoursUntilStart);
  const logTime = Math.log(1 + effectiveHours);

  // targetZ = beta0 + beta1 * (M - 1) + beta2 * logTime - beta3 * vacancyRatio
  // M - 1 = (targetZ - beta0 - beta2 * logTime + beta3 * vacancyRatio) / beta1
  const rawPremium =
    (targetZ -
      ELASTICITY.beta0 -
      ELASTICITY.beta2 * logTime +
      ELASTICITY.beta3 * vacancyRatio) /
    ELASTICITY.beta1;

  const rawMultiplier = 1.0 + Math.max(0, rawPremium);
  const clamped = Math.min(
    ELASTICITY.maxMultiplier,
    Math.max(ELASTICITY.minMultiplier, rawMultiplier),
  );
  return Math.round(clamped * 100) / 100;
}

/**
 * Master Surge Pricing Engine:
 * Analyzes market urgency, vacancy deficit, and calendar premiums to produce an optimal wage recommendation.
 */
export function calculateShiftSurge(input: SurgeInput): SurgePricingResult {
  const timeZone = input.timeZone ?? ISTANBUL_TIME_ZONE;
  const now = input.asOfDate ? input.asOfDate.getTime() : Date.now();
  const startsAtMs = input.startsAt.getTime();
  const hoursUntilStart = Math.max(0, (startsAtMs - now) / (1000 * 3600));

  const totalHeadcount = Math.max(1, input.headcount);
  const remaining = Math.max(0, Math.min(totalHeadcount, input.remainingHeadcount));
  const vacancyRatio = remaining / totalHeadcount;

  // If no seats remain or shift is already well past, surge is not applicable
  if (remaining === 0) {
    return {
      surgeMultiplier: 1.0,
      urgencyTier: 'nominal',
      hoursUntilStart,
      vacancyRatio: 0,
      nightFraction: 0,
      isWeekend: false,
      basePayMinor: input.basePayAmountMinor ?? null,
      recommendedPayMinor: input.basePayAmountMinor ?? null,
      estimatedFillProbability: 1.0,
      suggestedMultiplierForTarget: () => 1.0,
    };
  }

  // Time urgency decay factor tau in [0, 1]
  let tau = 0;
  if (hoursUntilStart <= 1.0) {
    tau = 1.0;
  } else if (hoursUntilStart < ELASTICITY.horizonHours) {
    const fraction = (ELASTICITY.horizonHours - hoursUntilStart) / ELASTICITY.horizonHours;
    tau = Math.pow(fraction, 2.0); // quadratic escalation as start time nears
  }

  // Night shift and weekend scarcity premiums
  const nightFraction = calculateNightWorkFraction(input.startsAt, input.endsAt, timeZone);
  const isWeekend = isWeekendShift(input.startsAt, timeZone);

  const nightPremium = 0.15 * nightFraction;
  const weekendPremium = isWeekend ? 0.08 : 0.0;

  // Base raw surge multiplier: 1.0 + timeUrgency * vacancyRatio + bonuses
  const vacancyImpact = 0.45 * tau * vacancyRatio;
  const rawMultiplier = 1.0 + vacancyImpact + nightPremium + weekendPremium;

  const clampedMultiplier = Math.min(
    ELASTICITY.maxMultiplier,
    Math.max(ELASTICITY.minMultiplier, Math.round(rawMultiplier * 100) / 100),
  );

  // Classify urgency tier
  let urgencyTier: UrgencyTier = 'nominal';
  if (clampedMultiplier >= 1.4 || (hoursUntilStart <= 2.0 && vacancyRatio > 0.3)) {
    urgencyTier = 'critical_surge';
  } else if (clampedMultiplier >= 1.25 || (hoursUntilStart <= 6.0 && vacancyRatio > 0.4)) {
    urgencyTier = 'high_urgency';
  } else if (clampedMultiplier >= 1.1 || hoursUntilStart <= 12.0) {
    urgencyTier = 'elevated';
  }

  const basePay = input.basePayAmountMinor ?? null;
  const recommendedPay =
    basePay !== null ? Math.round(basePay * clampedMultiplier) : null;

  const estimatedFillProb = computeFillProbability(
    clampedMultiplier,
    hoursUntilStart,
    vacancyRatio,
  );

  return {
    surgeMultiplier: clampedMultiplier,
    urgencyTier,
    hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
    vacancyRatio: Math.round(vacancyRatio * 100) / 100,
    nightFraction: Math.round(nightFraction * 100) / 100,
    isWeekend,
    basePayMinor: basePay,
    recommendedPayMinor: recommendedPay,
    estimatedFillProbability: estimatedFillProb,
    suggestedMultiplierForTarget: (targetConfidence: number) =>
      solveMultiplierForConfidence(targetConfidence, hoursUntilStart, vacancyRatio),
  };
}
