import { describe, expect, it } from 'vitest';
import {
  computeReputationMetrics,
  computeWilsonLowerBound,
} from './reputation-scoring.util.js';

describe('Wilson Score & Bayesian Trust Scoring Algorithm', () => {
  describe('computeWilsonLowerBound', () => {
    it('returns 0 for zero total reviews', () => {
      expect(computeWilsonLowerBound(0, 0)).toBe(0);
    });

    it('returns conservative score for 1 review of 100% positive', () => {
      // 1 out of 1 positive review has low statistical confidence
      const lowerBound = computeWilsonLowerBound(1, 1);
      // Wilson lower bound for 1/1 at 95% confidence is ~0.207
      expect(lowerBound).toBeLessThan(0.3);
      expect(lowerBound).toBeGreaterThan(0.15);
    });

    it('returns high statistical confidence for 100 reviews with 98% positive', () => {
      const lowerBound = computeWilsonLowerBound(98, 100);
      // Wilson lower bound for 98/100 at 95% confidence is ~0.930
      expect(lowerBound).toBeGreaterThan(0.9);
    });

    it('properly outranks high sample count over low sample count with identical percentage', () => {
      const oneReview = computeWilsonLowerBound(1, 1);
      const fiftyReviews = computeWilsonLowerBound(50, 50);
      expect(fiftyReviews).toBeGreaterThan(oneReview);
      expect(fiftyReviews).toBeGreaterThan(0.9);
    });
  });

  describe('computeReputationMetrics', () => {
    it('returns neutral safe defaults for unrated users', () => {
      const metrics = computeReputationMetrics([]);
      expect(metrics.averageRating).toBeNull();
      expect(metrics.ratingCount).toBe(0);
      expect(metrics.trustScore).toBe(75);
      expect(metrics.wilsonLowerBound).toBe(0);
    });

    it('correctly scores an established worker with consistent 5-star ratings', () => {
      const ratings = [5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 5, 5];
      const metrics = computeReputationMetrics(ratings);

      expect(metrics.ratingCount).toBe(12);
      expect(metrics.averageRating).toBeGreaterThanOrEqual(4.9);
      expect(metrics.satisfactionRate).toBe(100);
      expect(metrics.wilsonLowerBound).toBeGreaterThan(0.7);
      expect(metrics.trustScore).toBeGreaterThanOrEqual(85);
    });

    it('penalizes high variance / conflicting ratings', () => {
      // Worker with extreme variance: five 5s and five 1s
      const polarizedRatings = [5, 5, 5, 5, 5, 1, 1, 1, 1, 1];
      const metrics = computeReputationMetrics(polarizedRatings);

      expect(metrics.ratingCount).toBe(10);
      expect(metrics.satisfactionRate).toBe(50);
      expect(metrics.trustScore).toBeLessThan(55);
    });
  });
});
