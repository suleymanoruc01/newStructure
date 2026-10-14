import type {
  CandidateScoreBadge,
  CandidateScoreBreakdown,
} from '@parton/api-contracts';

export interface CandidateRankingJobContext {
  sectorCode: string;
  occupationCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CandidateRankingWorkerContext {
  workerUserId: string;
  sectorCodes: string[];
  occupationCodes: string[];
  homeLatitude?: number | null;
  homeLongitude?: number | null;
  ratings: number[];
  completedShiftsCount: number;
  cancelledShiftsCount: number;
  completedSectorShiftsCount: number;
}

/**
 * Computes the distance between two coordinates using the Haversine formula (km).
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Bayesian smoothed average rating.
 * Prior mean m = 4.2, prior confidence C = 3.
 * Prevents 1-review 5.0 from outranking 50-review 4.9.
 */
export function computeBayesianRating(ratings: number[]): {
  bayesianRating: number;
  ratingScore: number;
  averageRating: number | null;
} {
  const PRIOR_MEAN = 4.2;
  const PRIOR_COUNT = 3;
  if (!ratings.length) {
    const score = Math.round(((PRIOR_MEAN - 1.0) / 4.0) * 100);
    return { bayesianRating: PRIOR_MEAN, ratingScore: score, averageRating: null };
  }
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = sum / ratings.length;
  const bayesian = (PRIOR_COUNT * PRIOR_MEAN + sum) / (PRIOR_COUNT + ratings.length);
  const score = Math.max(0, Math.min(100, Math.round(((bayesian - 1.0) / 4.0) * 100)));
  return {
    bayesianRating: Number(bayesian.toFixed(2)),
    ratingScore: score,
    averageRating: Number(avg.toFixed(1)),
  };
}

/**
 * Reliability Score: Exponential penalty on cancellation rate.
 * S_rel = 100 * exp(-3.0 * cancellationRate)
 */
export function computeReliabilityScore(
  completed: number,
  cancelled: number,
): number {
  const total = completed + cancelled;
  if (total === 0) {
    return 85;
  }
  const cancellationRate = cancelled / total;
  const score = Math.round(100 * Math.exp(-3.0 * cancellationRate));
  return Math.max(10, Math.min(100, score));
}

/**
 * Domain Experience Score:
 * Match on exact occupation (60 base) or sector (35 base) + bonus per completed shift in sector (+8 pts each, up to 40 max).
 */
export function computeSectorExperienceScore(
  job: CandidateRankingJobContext,
  worker: {
    sectorCodes: string[];
    occupationCodes: string[];
    completedSectorShiftsCount: number;
  },
): number {
  let base = 15;
  const targetOcc = job.occupationCode;
  const occupationMatch = Boolean(
    targetOcc && worker.occupationCodes.includes(targetOcc),
  );
  const sectorMatch = worker.sectorCodes.includes(job.sectorCode);

  if (occupationMatch) {
    base = 60;
  } else if (sectorMatch) {
    base = 35;
  }

  const shiftBonus = Math.min(40, worker.completedSectorShiftsCount * 8);
  return Math.min(100, base + shiftBonus);
}

/**
 * Commute / Proximity Score:
 * S_prox = 100 * exp(-d / 20)
 */
export function computeProximityScore(
  jobLat?: number | null,
  jobLon?: number | null,
  workerLat?: number | null,
  workerLon?: number | null,
): number {
  if (
    jobLat == null ||
    jobLon == null ||
    workerLat == null ||
    workerLon == null
  ) {
    return 75;
  }
  const distKm = haversineDistanceKm(jobLat, jobLon, workerLat, workerLon);
  const score = Math.round(100 * Math.exp(-distKm / 20));
  return Math.max(10, Math.min(100, score));
}

/**
 * Overall Candidate Quality Index (CQI) & Tier Assignment
 */
export function computeCandidateScore(
  job: CandidateRankingJobContext,
  worker: CandidateRankingWorkerContext,
): CandidateScoreBreakdown {
  const { ratingScore, averageRating } = computeBayesianRating(worker.ratings);
  const reliabilityScore = computeReliabilityScore(
    worker.completedShiftsCount,
    worker.cancelledShiftsCount,
  );
  const sectorExperienceScore = computeSectorExperienceScore(job, worker);
  const proximityScore = computeProximityScore(
    job.latitude,
    job.longitude,
    worker.homeLatitude,
    worker.homeLongitude,
  );

  const totalScore = Math.round(
    0.3 * ratingScore +
      0.25 * sectorExperienceScore +
      0.25 * reliabilityScore +
      0.2 * proximityScore,
  );

  let badge: CandidateScoreBadge = 'standard';
  if (totalScore >= 88) {
    badge = 'top_talent';
  } else if (totalScore >= 75) {
    badge = 'verified_pro';
  } else if (totalScore >= 65 && worker.completedShiftsCount <= 2) {
    badge = 'rising_star';
  } else if (totalScore >= 50) {
    badge = 'reliable';
  }

  return {
    totalScore,
    ratingScore,
    reliabilityScore,
    sectorExperienceScore,
    proximityScore,
    completedShiftsCount: worker.completedShiftsCount,
    averageRating,
    ratingCount: worker.ratings.length,
    badge,
  };
}
