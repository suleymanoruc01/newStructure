/**
 * Multi-Factor Personalized Job Feed Ranking Engine.
 *
 * Replaces naive 1D sorting with a multi-objective utility scoring algorithm:
 * 1. Base Candidate-Job Eligibility Affinity (S_match)
 * 2. Dynamic Wage Surge Bonus (S_surge)
 * 3. Spatiotemporal Commute Friction Decay (S_proximity)
 * 4. Imminent Shift Urgency Escalation (S_urgency)
 * 5. Employer Affinity / VIP Connection (S_affinity)
 * 6. Temporal Freshness / Cold-Start Exploration Bonus (B_freshness)
 */

export type FeedRankingInput = {
  matchScore: number; // [0, 100]
  distanceKm: number | null;
  surgeMultiplier?: number; // e.g. 1.0 to 1.75
  startsAt: Date;
  publishedAt?: Date | null;
  isFavoredEmployer?: boolean;
  asOfDate?: Date;
};

export type FeedRankingBreakdown = {
  totalRankScore: number; // [0, 100]
  matchComponent: number;
  surgeComponent: number;
  proximityComponent: number;
  urgencyComponent: number;
  affinityComponent: number;
  freshnessBonus: number;
};

// Calibrated weights for gig worker feed ordering
const WEIGHTS = {
  match: 0.35, // Core skill and availability match
  surge: 0.20, // Premium wage attraction
  proximity: 0.20, // Geodesic commute decay
  urgency: 0.15, // Shift imminence priority
  affinity: 0.10, // Favorited employer connection
} as const;

/**
 * Computes the multi-attribute recommendation score for a job card in the worker feed.
 */
export function computeJobFeedRankingScore(
  input: FeedRankingInput,
): FeedRankingBreakdown {
  const now = input.asOfDate ? input.asOfDate.getTime() : Date.now();
  const startsAtMs = input.startsAt.getTime();
  const hoursUntilStart = Math.max(0, (startsAtMs - now) / (3600 * 1000));

  // 1. Match score component [0, 100]
  const matchScore = Math.max(0, Math.min(100, input.matchScore));

  // 2. Surge component: 1.0 = 0 pts, 1.5+ = 100 pts
  const multiplier = input.surgeMultiplier ?? 1.0;
  const surgePremium = Math.max(0, multiplier - 1.0);
  const surgeComponent = Math.round(Math.min(100, (surgePremium / 0.5) * 100));

  // 3. Proximity component: exponential decay (d=0 -> 100, d=15km -> 37, d=30km -> 14)
  let proximityComponent = 50; // Default when distance is unknown
  if (input.distanceKm !== null && Number.isFinite(input.distanceKm)) {
    const d = Math.max(0, input.distanceKm);
    proximityComponent = Math.round(100 * Math.exp(-d / 15.0));
  }

  // 4. Urgency component: shifts starting within 2 to 18 hours get boosted
  // Peak urgency between 2h and 6h before shift start
  let urgencyComponent = 0;
  if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
    // Escalate as start time approaches, peaking around 2 hours
    const scaledTime = Math.max(0, hoursUntilStart - 1.0);
    urgencyComponent = Math.round(100 * Math.exp(-scaledTime / 10.0));
  }

  // 5. Affinity component
  const affinityComponent = input.isFavoredEmployer ? 100 : 0;

  // 6. Freshness exploration bonus (decaying over 120 minutes)
  let freshnessBonus = 0;
  if (input.publishedAt) {
    const publishedAtMs = input.publishedAt.getTime();
    const ageMinutes = Math.max(0, (now - publishedAtMs) / 60000);
    if (ageMinutes < 120) {
      freshnessBonus = Math.round(15 * (1 - ageMinutes / 120));
    }
  }

  const rawWeightedScore =
    WEIGHTS.match * matchScore +
    WEIGHTS.surge * surgeComponent +
    WEIGHTS.proximity * proximityComponent +
    WEIGHTS.urgency * urgencyComponent +
    WEIGHTS.affinity * affinityComponent +
    freshnessBonus;

  const totalRankScore = Math.min(100, Math.max(0, Math.round(rawWeightedScore)));

  return {
    totalRankScore,
    matchComponent: Math.round(WEIGHTS.match * matchScore),
    surgeComponent: Math.round(WEIGHTS.surge * surgeComponent),
    proximityComponent: Math.round(WEIGHTS.proximity * proximityComponent),
    urgencyComponent: Math.round(WEIGHTS.urgency * urgencyComponent),
    affinityComponent: Math.round(WEIGHTS.affinity * affinityComponent),
    freshnessBonus,
  };
}

/**
 * Sorts an array of feed items using the multi-attribute ranking score.
 * Tie-breaks deterministically by startsAt ascending, then id ascending.
 */
export function rankJobFeedItems<
  T extends {
    job: { id: string; startsAt: Date; publishedAt: Date | null };
    eligibility: { matchScore: number; distanceKm: number | null };
    surgeMultiplier?: number;
    isFavored?: boolean;
  },
>(items: T[], asOfDate?: Date): Array<T & { feedRankScore: number }> {
  const scored = items.map((item) => {
    const breakdown = computeJobFeedRankingScore({
      matchScore: item.eligibility.matchScore,
      distanceKm: item.eligibility.distanceKm,
      surgeMultiplier: item.surgeMultiplier,
      startsAt: item.job.startsAt,
      publishedAt: item.job.publishedAt,
      isFavoredEmployer: item.isFavored,
      asOfDate,
    });
    return {
      ...item,
      feedRankScore: breakdown.totalRankScore,
    };
  });

  scored.sort((a, b) => {
    const diff = b.feedRankScore - a.feedRankScore;
    if (diff !== 0) return diff;
    const timeDiff = a.job.startsAt.getTime() - b.job.startsAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.job.id.localeCompare(b.job.id);
  });

  return scored;
}
