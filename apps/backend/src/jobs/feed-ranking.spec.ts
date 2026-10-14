import { describe, expect, it } from 'vitest';
import {
  computeJobFeedRankingScore,
  rankJobFeedItems,
} from './feed-ranking.util.js';

describe('feed-ranking.util', () => {
  const asOf = new Date('2026-10-14T10:00:00.000Z');

  describe('computeJobFeedRankingScore', () => {
    it('gives top scores to high-match, proximate, surging jobs', () => {
      const topJob = computeJobFeedRankingScore({
        matchScore: 95,
        distanceKm: 2.0,
        surgeMultiplier: 1.4,
        startsAt: new Date('2026-10-14T14:00:00.000Z'), // 4 hours away
        publishedAt: new Date('2026-10-14T09:30:00.000Z'), // 30 mins ago
        isFavoredEmployer: true,
        asOfDate: asOf,
      });

      expect(topJob.totalRankScore).toBeGreaterThanOrEqual(80);
      expect(topJob.surgeComponent).toBeGreaterThan(0);
      expect(topJob.proximityComponent).toBeGreaterThan(15);
      expect(topJob.freshnessBonus).toBeGreaterThan(0);
    });

    it('penalizes distant jobs through exponential proximity decay', () => {
      const closeJob = computeJobFeedRankingScore({
        matchScore: 80,
        distanceKm: 1.5,
        startsAt: new Date('2026-10-15T10:00:00.000Z'),
        asOfDate: asOf,
      });

      const farJob = computeJobFeedRankingScore({
        matchScore: 80,
        distanceKm: 35.0,
        startsAt: new Date('2026-10-15T10:00:00.000Z'),
        asOfDate: asOf,
      });

      expect(closeJob.totalRankScore).toBeGreaterThan(farJob.totalRankScore);
      expect(closeJob.proximityComponent).toBeGreaterThan(farJob.proximityComponent);
    });

    it('boosts imminent shifts starting in 3 hours over shifts in 48 hours', () => {
      const imminent = computeJobFeedRankingScore({
        matchScore: 70,
        distanceKm: 5,
        startsAt: new Date('2026-10-14T13:00:00.000Z'), // 3 hours away
        asOfDate: asOf,
      });

      const distant = computeJobFeedRankingScore({
        matchScore: 70,
        distanceKm: 5,
        startsAt: new Date('2026-10-16T10:00:00.000Z'), // 48 hours away
        asOfDate: asOf,
      });

      expect(imminent.totalRankScore).toBeGreaterThan(distant.totalRankScore);
      expect(imminent.urgencyComponent).toBeGreaterThan(distant.urgencyComponent);
    });
  });

  describe('rankJobFeedItems', () => {
    it('orders feed items by composite rank score descending', () => {
      const items = [
        {
          job: {
            id: 'job-low',
            startsAt: new Date('2026-10-16T10:00:00.000Z'),
            publishedAt: null,
          },
          eligibility: { matchScore: 40, distanceKm: 25 },
          surgeMultiplier: 1.0,
          isFavored: false,
        },
        {
          job: {
            id: 'job-high',
            startsAt: new Date('2026-10-14T15:00:00.000Z'), // 5 hours away
            publishedAt: new Date('2026-10-14T09:45:00.000Z'),
          },
          eligibility: { matchScore: 90, distanceKm: 3 },
          surgeMultiplier: 1.3,
          isFavored: true,
        },
        {
          job: {
            id: 'job-med',
            startsAt: new Date('2026-10-15T10:00:00.000Z'),
            publishedAt: null,
          },
          eligibility: { matchScore: 75, distanceKm: 6 },
          surgeMultiplier: 1.1,
          isFavored: false,
        },
      ];

      const ranked = rankJobFeedItems(items, asOf);

      expect(ranked[0].job.id).toBe('job-high');
      expect(ranked[1].job.id).toBe('job-med');
      expect(ranked[2].job.id).toBe('job-low');
      expect(ranked[0].feedRankScore).toBeGreaterThan(ranked[1].feedRankScore);
      expect(ranked[1].feedRankScore).toBeGreaterThan(ranked[2].feedRankScore);
    });

    it('breaks ties deterministically by startsAt and job id', () => {
      const items = [
        {
          job: {
            id: 'job-b',
            startsAt: new Date('2026-10-15T12:00:00.000Z'),
            publishedAt: null,
          },
          eligibility: { matchScore: 80, distanceKm: 5 },
        },
        {
          job: {
            id: 'job-a',
            startsAt: new Date('2026-10-15T10:00:00.000Z'),
            publishedAt: null,
          },
          eligibility: { matchScore: 80, distanceKm: 5 },
        },
      ];

      const ranked = rankJobFeedItems(items, asOf);
      expect(ranked[0].job.id).toBe('job-a');
      expect(ranked[1].job.id).toBe('job-b');
    });
  });
});
