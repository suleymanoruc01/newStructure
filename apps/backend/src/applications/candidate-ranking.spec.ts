import { describe, expect, it } from 'vitest';
import {
  computeBayesianRating,
  computeCandidateScore,
  computeProximityScore,
  computeReliabilityScore,
  computeSectorExperienceScore,
  haversineDistanceKm,
} from './candidate-ranking.util.js';
import {
  calculateRequiredTransitMinutes,
  evaluateShiftFeasibility,
  validateScheduleSweepLine,
} from './schedule-feasibility.js';

describe('Candidate Ranking Algorithm', () => {
  describe('haversineDistanceKm', () => {
    it('calculates accurate distance between Istanbul Kadıköy and Beşiktaş', () => {
      // Kadıköy: 40.9904, 29.0292; Beşiktaş: 41.0428, 29.0077 (~6 km air line)
      const dist = haversineDistanceKm(40.9904, 29.0292, 41.0428, 29.0077);
      expect(dist).toBeGreaterThan(5);
      expect(dist).toBeLessThan(8);
    });

    it('returns 0 for identical points', () => {
      expect(haversineDistanceKm(41.0, 29.0, 41.0, 29.0)).toBe(0);
    });
  });

  describe('computeBayesianRating', () => {
    it('returns baseline prior score for worker with 0 reviews', () => {
      const result = computeBayesianRating([]);
      expect(result.averageRating).toBeNull();
      expect(result.bayesianRating).toBe(4.2);
      expect(result.ratingScore).toBe(80);
    });

    it('shrinks a single 5-star review towards the platform prior mean', () => {
      // (3 * 4.2 + 5.0) / 4 = 17.6 / 4 = 4.4
      const result = computeBayesianRating([5]);
      expect(result.averageRating).toBe(5.0);
      expect(result.bayesianRating).toBe(4.4);
      expect(result.ratingScore).toBe(85);
    });

    it('gives higher confidence score to a worker with 20 reviews of 4.9', () => {
      const twentyReviews = Array(20).fill(4.9);
      const result = computeBayesianRating(twentyReviews);
      expect(result.averageRating).toBe(4.9);
      expect(result.bayesianRating).toBeGreaterThan(4.7);
      expect(result.ratingScore).toBeGreaterThanOrEqual(92);
    });
  });

  describe('computeReliabilityScore', () => {
    it('awards 100 to workers with zero cancellations', () => {
      expect(computeReliabilityScore(15, 0)).toBe(100);
    });

    it('penalizes cancellations exponentially', () => {
      // 5 completed, 5 cancelled => 50% cancellation rate
      // 100 * exp(-3.0 * 0.5) = 100 * exp(-1.5) ≈ 22
      const score = computeReliabilityScore(5, 5);
      expect(score).toBeLessThanOrEqual(25);
    });
  });

  describe('computeSectorExperienceScore', () => {
    const job = {
      sectorCode: 'gastronomy',
      occupationCode: 'barista',
    };

    it('gives max baseline for exact occupation match plus completed shifts bonus', () => {
      const score = computeSectorExperienceScore(job, {
        sectorCodes: ['gastronomy'],
        occupationCodes: ['barista'],
        completedSectorShiftsCount: 5,
      });
      // 60 base + min(40, 5 * 8 = 40) = 100
      expect(score).toBe(100);
    });

    it('gives sector baseline for same sector but different occupation', () => {
      const score = computeSectorExperienceScore(job, {
        sectorCodes: ['gastronomy'],
        occupationCodes: ['waiter'],
        completedSectorShiftsCount: 0,
      });
      expect(score).toBe(35);
    });
  });

  describe('computeProximityScore', () => {
    it('returns high score for candidate within 2 km', () => {
      // 41.0000, 29.0000 and 41.0100, 29.0000 is ~1.1 km
      const score = computeProximityScore(41.0, 29.0, 41.01, 29.0);
      expect(score).toBeGreaterThan(90);
    });

    it('returns decaying score for candidate 30 km away', () => {
      // 41.0000, 29.0000 and 41.2700, 29.0000 is ~30 km
      const score = computeProximityScore(41.0, 29.0, 41.27, 29.0);
      expect(score).toBeLessThan(30);
    });
  });

  describe('computeCandidateScore composite', () => {
    it('awards top_talent badge to an exceptional candidate', () => {
      const score = computeCandidateScore(
        {
          sectorCode: 'gastronomy',
          occupationCode: 'barista',
          latitude: 41.0082,
          longitude: 28.9784,
        },
        {
          workerUserId: 'worker-1',
          sectorCodes: ['gastronomy'],
          occupationCodes: ['barista'],
          homeLatitude: 41.01,
          homeLongitude: 28.98,
          ratings: [5, 5, 5, 5, 5, 4, 5, 5],
          completedShiftsCount: 20,
          cancelledShiftsCount: 0,
          completedSectorShiftsCount: 15,
        },
      );
      expect(score.totalScore).toBeGreaterThanOrEqual(88);
      expect(score.badge).toBe('top_talent');
    });
  });
});

describe('Transit-Aware Schedule Feasibility Algorithm', () => {
  it('calculates realistic transit time for 20 km urban transit', () => {
    const mins = calculateRequiredTransitMinutes(20);
    // (20 / 25) * 60 + 15 = 48 + 15 = 63 mins
    expect(mins).toBe(63);
  });

  it('detects temporal overlap', () => {
    const shiftA = {
      id: 'a',
      jobId: 'job-a',
      startsAt: new Date('2026-10-15T09:00:00Z'),
      endsAt: new Date('2026-10-15T15:00:00Z'),
    };
    const shiftB = {
      id: 'b',
      jobId: 'job-b',
      startsAt: new Date('2026-10-15T14:00:00Z'),
      endsAt: new Date('2026-10-15T20:00:00Z'),
    };
    const res = evaluateShiftFeasibility(shiftA, shiftB);
    expect(res.hasConflict).toBe(true);
    expect(res.type).toBe('temporal_overlap');
  });

  it('detects transit infeasibility between non-overlapping shifts with tight turnaround', () => {
    // Shift A ends at 15:00 in Kadıköy (40.99, 29.02)
    // Shift B starts at 15:20 in Beylikdüzü (41.00, 28.65) - ~32 km away!
    const shiftA = {
      id: 'kadikoy',
      jobId: 'job-1',
      startsAt: new Date('2026-10-15T09:00:00Z'),
      endsAt: new Date('2026-10-15T15:00:00Z'),
      latitude: 40.99,
      longitude: 29.02,
    };
    const shiftB = {
      id: 'beylikduzu',
      jobId: 'job-2',
      startsAt: new Date('2026-10-15T15:20:00Z'),
      endsAt: new Date('2026-10-15T21:00:00Z'),
      latitude: 41.0,
      longitude: 28.65,
    };
    const res = evaluateShiftFeasibility(shiftA, shiftB);
    expect(res.hasConflict).toBe(true);
    expect(res.type).toBe('transit_infeasible');
    expect(res.availableMinutes).toBe(20);
    expect(res.requiredTransitMinutes).toBeGreaterThan(60);
  });

  it('sweep-line validator catches conflicts across chain of shifts', () => {
    const shifts = [
      {
        id: '1',
        jobId: 'j1',
        startsAt: new Date('2026-10-15T08:00:00Z'),
        endsAt: new Date('2026-10-15T12:00:00Z'),
        latitude: 41.0,
        longitude: 29.0,
      },
      {
        id: '2',
        jobId: 'j2',
        startsAt: new Date('2026-10-15T12:10:00Z'),
        endsAt: new Date('2026-10-15T16:00:00Z'),
        latitude: 41.05,
        longitude: 28.6, // Far away venue with only 10 min gap
      },
    ];
    const conflicts = validateScheduleSweepLine(shifts);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]?.type).toBe('transit_infeasible');
  });
});
