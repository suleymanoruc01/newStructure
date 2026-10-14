/**
 * SOS Emergency Flash Shift Dispatch & Rapid Refill Engine.
 *
 * Designed for critical last-minute staffing dropouts (<60 minutes before shift start).
 * Computes dynamic emergency wage surge multipliers (+25% to +50%), isochrone distance
 * radius filtering (<=5km), multi-criteria candidate readiness scoring, and atomic
 * first-claim dispatch packages.
 */

export type EmergencyShiftContext = {
  shiftId: string;
  jobId: string;
  branchId: string;
  branchName: string;
  branchLatitude: number;
  branchLongitude: number;
  basePayAmountTry: number;
  startsAt: Date;
  endsAt: Date;
  requiredOccupationCode?: string;
};

export type EmergencyCandidate = {
  workerUserId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  reliabilityScore: number; // 0 - 100
  averageRating?: number | null; // 1.0 - 5.0
  occupationCodes: string[];
  hasConflict: boolean;
  employerAffinityScore?: number; // 0 - 1
  isReadyNow?: boolean;
};

export type EmergencyDispatchCandidate = {
  workerUserId: string;
  displayName: string;
  distanceKm: number;
  emergencyScore: number;
  offeredPayAmountTry: number;
  surgeMultiplier: number;
  rank: number;
};

export type EmergencyDispatchPackage = {
  shiftId: string;
  urgencyMinutes: number;
  surgeMultiplier: number;
  originalPayTry: number;
  emergencyPayTry: number;
  candidatesDispatched: EmergencyDispatchCandidate[];
  claimWindowSeconds: number;
};

/**
 * Calculates haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Computes dynamic emergency surge multiplier based on minutes remaining to shift start.
 * Urgency multiplier scales between 1.25x (+25%) and 1.50x (+50%).
 */
export function computeEmergencySurgeMultiplier(
  startsAt: Date,
  now: Date = new Date(),
): number {
  const minutesUntilStart = Math.max(0, (startsAt.getTime() - now.getTime()) / 60_000);

  if (minutesUntilStart > 120) {
    return 1.15; // Mild surge for > 2 hours
  }

  // Linear progression from 1.25x (at 60 mins) to 1.50x (at 0 mins)
  const ratio = Math.min(1, Math.max(0, (60 - minutesUntilStart) / 60));
  const surge = 1.25 + ratio * 0.25;
  return Number(surge.toFixed(2));
}

/**
 * Evaluates candidate readiness score for emergency dispatch.
 * Weights: Proximity decay (0.45), Reliability (0.35), Employer affinity (0.20).
 */
export function scoreEmergencyCandidate(
  candidate: EmergencyCandidate,
  distanceKm: number,
  maxDistanceKm: number = 5.0,
): number {
  if (candidate.hasConflict) {
    return 0;
  }

  // Normalized distance score (0 at maxDistanceKm, 1 at 0km)
  const proximityScore = Math.max(0, 1 - distanceKm / maxDistanceKm);

  // Normalized reliability score (0.0 to 1.0)
  const reliabilityNorm = Math.min(1, Math.max(0, candidate.reliabilityScore / 100));

  // Affinity score
  const affinity = candidate.employerAffinityScore ?? 0.5;

  // Bonus for explicit "Ready Now" toggle
  const readyBonus = candidate.isReadyNow ? 0.15 : 0.0;

  const rawScore =
    proximityScore * 0.45 +
    reliabilityNorm * 0.35 +
    affinity * 0.20 +
    readyBonus;

  return Number(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(4));
}

/**
 * Prepares an SOS Emergency Dispatch Package for a critical vacancy.
 */
export function buildEmergencyDispatchPackage(
  context: EmergencyShiftContext,
  availableCandidates: EmergencyCandidate[],
  options: {
    now?: Date;
    maxIsochroneDistanceKm?: number;
    maxDispatchCount?: number;
  } = {},
): EmergencyDispatchPackage {
  const now = options.now ?? new Date();
  const maxDistanceKm = options.maxIsochroneDistanceKm ?? 5.0;
  const maxCount = options.maxDispatchCount ?? 15;

  const minutesUntilStart = Math.max(
    0,
    Math.round((context.startsAt.getTime() - now.getTime()) / 60_000),
  );

  const surgeMultiplier = computeEmergencySurgeMultiplier(context.startsAt, now);
  const emergencyPayTry = Math.round(context.basePayAmountTry * surgeMultiplier);

  const evaluated: EmergencyDispatchCandidate[] = [];

  for (const candidate of availableCandidates) {
    if (candidate.hasConflict) {
      continue;
    }

    if (
      context.requiredOccupationCode &&
      !candidate.occupationCodes.includes(context.requiredOccupationCode)
    ) {
      continue;
    }

    const distance = haversineDistanceKm(
      context.branchLatitude,
      context.branchLongitude,
      candidate.latitude,
      candidate.longitude,
    );

    if (distance > maxDistanceKm) {
      continue;
    }

    const score = scoreEmergencyCandidate(candidate, distance, maxDistanceKm);
    if (score < 0.25) {
      continue;
    }

    evaluated.push({
      workerUserId: candidate.workerUserId,
      displayName: candidate.displayName,
      distanceKm: distance,
      emergencyScore: score,
      offeredPayAmountTry: emergencyPayTry,
      surgeMultiplier,
      rank: 0,
    });
  }

  // Sort by highest emergency score descending, then closest distance ascending
  evaluated.sort((a, b) => b.emergencyScore - a.emergencyScore || a.distanceKm - b.distanceKm);

  // Take top N and assign rank
  const dispatched = evaluated.slice(0, maxCount).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  // Claim window is tight for emergency refills (e.g. 180 seconds / 3 mins for rapid claim)
  const claimWindowSeconds = minutesUntilStart <= 30 ? 120 : 180;

  return {
    shiftId: context.shiftId,
    urgencyMinutes: minutesUntilStart,
    surgeMultiplier,
    originalPayTry: context.basePayAmountTry,
    emergencyPayTry,
    candidatesDispatched: dispatched,
    claimWindowSeconds,
  };
}
