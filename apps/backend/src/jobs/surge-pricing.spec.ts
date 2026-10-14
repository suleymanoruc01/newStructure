import { describe, expect, it } from 'vitest';
import {
  calculateNightWorkFraction,
  calculateShiftSurge,
  computeFillProbability,
  isWeekendShift,
  solveMultiplierForConfidence,
} from './surge-pricing.util.js';

describe('surge-pricing.util', () => {
  describe('calculateNightWorkFraction', () => {
    it('returns 0 for daytime shift (09:00 - 17:00)', () => {
      // 2026-10-15 09:00 to 17:00 Istanbul time (+03:00) -> UTC 06:00 to 14:00
      const starts = new Date('2026-10-15T06:00:00.000Z');
      const ends = new Date('2026-10-15T14:00:00.000Z');
      const fraction = calculateNightWorkFraction(starts, ends);
      expect(fraction).toBe(0);
    });

    it('returns 1.0 for overnight shift (22:00 - 05:00)', () => {
      // Istanbul 22:00 is UTC 19:00, 05:00 is UTC 02:00 next day
      const starts = new Date('2026-10-15T19:00:00.000Z');
      const ends = new Date('2026-10-16T02:00:00.000Z');
      const fraction = calculateNightWorkFraction(starts, ends);
      expect(fraction).toBe(1.0);
    });

    it('correctly calculates partial night shift spanning 18:00 to 22:00', () => {
      // Istanbul 18:00 is UTC 15:00, 22:00 is UTC 19:00 (4 hours total, 2 hours night: 20:00-22:00)
      const starts = new Date('2026-10-15T15:00:00.000Z');
      const ends = new Date('2026-10-15T19:00:00.000Z');
      const fraction = calculateNightWorkFraction(starts, ends);
      expect(fraction).toBeCloseTo(0.5, 1);
    });
  });

  describe('isWeekendShift', () => {
    it('detects Sunday and Saturday shifts correctly in Istanbul civil time', () => {
      // 2026-10-18 is Sunday (UTC 10:00 -> Istanbul 13:00)
      const sunday = new Date('2026-10-18T10:00:00.000Z');
      expect(isWeekendShift(sunday)).toBe(true);

      // 2026-10-14 is Wednesday
      const wednesday = new Date('2026-10-14T10:00:00.000Z');
      expect(isWeekendShift(wednesday)).toBe(false);
    });
  });

  describe('computeFillProbability & solveMultiplierForConfidence', () => {
    it('increases fill probability when wage multiplier is boosted', () => {
      const pBase = computeFillProbability(1.0, 5, 0.5);
      const pSurge = computeFillProbability(1.3, 5, 0.5);
      expect(pSurge).toBeGreaterThan(pBase);
    });

    it('decreases fill probability as shift start time becomes imminent', () => {
      const pFar = computeFillProbability(1.0, 20, 0.5);
      const pClose = computeFillProbability(1.0, 0.5, 0.5);
      expect(pFar).toBeGreaterThan(pClose);
    });

    it('inverts the logistic curve to solve for multiplier matching desired confidence', () => {
      const targetConfidence = 0.85;
      const hoursUntil = 3;
      const vacancy = 0.6;
      const solvedMultiplier = solveMultiplierForConfidence(targetConfidence, hoursUntil, vacancy);
      expect(solvedMultiplier).toBeGreaterThanOrEqual(1.0);

      // Evaluating back through probability function should yield near or above target
      const resultingProb = computeFillProbability(solvedMultiplier, hoursUntil, vacancy);
      expect(resultingProb).toBeGreaterThanOrEqual(0.80);
    });
  });

  describe('calculateShiftSurge', () => {
    it('returns nominal multiplier 1.0 when all seats are already filled', () => {
      const now = new Date('2026-10-14T10:00:00.000Z');
      const starts = new Date('2026-10-14T11:00:00.000Z'); // 1 hour away
      const ends = new Date('2026-10-14T19:00:00.000Z');

      const result = calculateShiftSurge({
        startsAt: starts,
        endsAt: ends,
        headcount: 5,
        remainingHeadcount: 0,
        basePayAmountMinor: 100000,
        asOfDate: now,
      });

      expect(result.surgeMultiplier).toBe(1.0);
      expect(result.urgencyTier).toBe('nominal');
      expect(result.estimatedFillProbability).toBe(1.0);
      expect(result.recommendedPayMinor).toBe(100000);
    });

    it('keeps nominal rate when shift has abundant lead time (> 24 hours)', () => {
      const now = new Date('2026-10-14T06:00:00.000Z');
      const starts = new Date('2026-10-16T06:00:00.000Z'); // 48 hours away, 09:00 - 17:00 Istanbul
      const ends = new Date('2026-10-16T14:00:00.000Z');

      const result = calculateShiftSurge({
        startsAt: starts,
        endsAt: ends,
        headcount: 4,
        remainingHeadcount: 4,
        basePayAmountMinor: 80000,
        asOfDate: now,
      });

      expect(result.surgeMultiplier).toBe(1.0);
      expect(result.urgencyTier).toBe('nominal');
      expect(result.recommendedPayMinor).toBe(80000);
    });

    it('applies critical surge for imminent, completely unfilled shift', () => {
      const now = new Date('2026-10-14T06:00:00.000Z');
      const starts = new Date('2026-10-14T07:00:00.000Z'); // 1 hour away
      const ends = new Date('2026-10-14T15:00:00.000Z');

      const result = calculateShiftSurge({
        startsAt: starts,
        endsAt: ends,
        headcount: 5,
        remainingHeadcount: 5,
        basePayAmountMinor: 100000,
        asOfDate: now,
      });

      expect(result.surgeMultiplier).toBeGreaterThanOrEqual(1.4);
      expect(result.urgencyTier).toBe('critical_surge');
      expect(result.recommendedPayMinor).toBeGreaterThan(140000);
      expect(result.suggestedMultiplierForTarget(0.9)).toBeGreaterThanOrEqual(result.surgeMultiplier);
    });

    it('caps maximum surge at 1.75x even under extreme compound stress', () => {
      // 30 mins away, 100% unfilled, full night shift on weekend
      const now = new Date('2026-10-18T19:30:00.000Z');
      const starts = new Date('2026-10-18T20:00:00.000Z'); // 23:00 Istanbul Sunday
      const ends = new Date('2026-10-19T03:00:00.000Z'); // 06:00 Istanbul Monday (100% night)

      const result = calculateShiftSurge({
        startsAt: starts,
        endsAt: ends,
        headcount: 10,
        remainingHeadcount: 10,
        basePayAmountMinor: 120000,
        asOfDate: now,
      });

      expect(result.surgeMultiplier).toBeLessThanOrEqual(1.75);
      expect(result.urgencyTier).toBe('critical_surge');
      expect(result.isWeekend).toBe(true);
      expect(result.nightFraction).toBe(1.0);
    });
  });
});
