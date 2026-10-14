export interface ReputationMetrics {
  averageRating: number | null;
  ratingCount: number;
  satisfactionRate: number;
  wilsonLowerBound: number;
  trustScore: number;
}

/**
 * Computes Wilson Score Lower Bound for Bernoulli parameter p.
 * Default 95% confidence level (z = 1.96).
 * Solves the "1 review with 5-star outranking 100 reviews with 4.9" flaw.
 */
export function computeWilsonLowerBound(
  positiveCount: number,
  totalCount: number,
  z: number = 1.96,
): number {
  if (totalCount === 0) {
    return 0;
  }
  const p = positiveCount / totalCount;
  const z2 = z * z;
  const denominator = 1 + z2 / totalCount;
  const center = p + z2 / (2 * totalCount);
  const spread =
    z * Math.sqrt((p * (1 - p)) / totalCount + z2 / (4 * totalCount * totalCount));

  const lower = (center - spread) / denominator;
  return Number(Math.max(0, Math.min(1, lower)).toFixed(3));
}

/**
 * Computes Dirichlet-Bayesian Credible Trust Index from an array of 1-5 star ratings.
 * Penalizes high variance and low sample counts.
 */
export function computeReputationMetrics(ratings: number[]): ReputationMetrics {
  const n = ratings.length;
  if (n === 0) {
    return {
      averageRating: null,
      ratingCount: 0,
      satisfactionRate: 85,
      wilsonLowerBound: 0,
      trustScore: 75, // Neutral baseline for new accounts
    };
  }

  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = sum / n;

  // Positive ratings: 4 or 5 stars
  const positives = ratings.filter((r) => r >= 4).length;
  const satisfactionRate = Math.round((positives / n) * 100);
  const wilsonLower = computeWilsonLowerBound(positives, n);

  // Bayesian prior with shrinkage
  const PRIOR_K = 5;
  const PRIOR_MEAN = 4.2;
  const bayesAvg = (PRIOR_K * PRIOR_MEAN + sum) / (PRIOR_K + n);

  // Variance calculation
  let variance = 0.6;
  if (n >= 2) {
    const sqDiffs = ratings.reduce((acc, r) => acc + Math.pow(r - avg, 2), 0);
    variance = sqDiffs / (n - 1);
  }
  const standardError = Math.sqrt(variance) / Math.sqrt(PRIOR_K + n);

  // 90% Lower Credible Bound (z = 1.645)
  const credibleRating = bayesAvg - 1.645 * standardError;
  const trustScore = Math.round(
    Math.max(10, Math.min(100, ((credibleRating - 1.0) / 4.0) * 100)),
  );

  return {
    averageRating: Number(avg.toFixed(2)),
    ratingCount: n,
    satisfactionRate,
    wilsonLowerBound: wilsonLower,
    trustScore,
  };
}
