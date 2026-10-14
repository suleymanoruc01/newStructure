import { describe, expect, it } from 'vitest';
import {
  buildEmergencyDispatchPackage,
  computeEmergencySurgeMultiplier,
  haversineDistanceKm,
  scoreEmergencyCandidate,
  type EmergencyCandidate,
  type EmergencyShiftContext,
} from './emergency-refill.util.js';

describe('emergency-refill.util', () => {
  describe('haversineDistanceKm', () => {
    it('calculates accurate distance between coordinates', () => {
      // Kadıköy Bull Statue to Moda Pier (~1.3 km)
      const dist = haversineDistanceKm(40.9904, 29.0292, 40.9796, 29.0261);
      expect(dist).toBeGreaterThan(1.0);
      expect(dist).toBeLessThan(1.6);
    });

    it('returns 0 for identical points', () => {
      const dist = haversineDistanceKm(41.0082, 28.9784, 41.0082, 28.9784);
      expect(dist).toBe(0);
    });
  });

  describe('computeEmergencySurgeMultiplier', () => {
    it('applies 1.50x surge when shift is starting immediately (0 mins)', () => {
      const now = new Date('2026-10-14T17:00:00Z');
      const start = new Date('2026-10-14T17:00:00Z');
      const multiplier = computeEmergencySurgeMultiplier(start, now);
      expect(multiplier).toBe(1.5);
    });

    it('applies 1.25x surge at exactly 60 minutes remaining', () => {
      const now = new Date('2026-10-14T16:00:00Z');
      const start = new Date('2026-10-14T17:00:00Z');
      const multiplier = computeEmergencySurgeMultiplier(start, now);
      expect(multiplier).toBe(1.25);
    });

    it('scales linearly between 1.25x and 1.50x at 30 minutes remaining', () => {
      const now = new Date('2026-10-14T16:30:00Z');
      const start = new Date('2026-10-14T17:00:00Z');
      const multiplier = computeEmergencySurgeMultiplier(start, now);
      expect(multiplier).toBe(1.38); // 1.25 + 0.5 * 0.25 = 1.375 rounded to 1.38
    });
  });

  describe('scoreEmergencyCandidate', () => {
    const baseCandidate: EmergencyCandidate = {
      workerUserId: 'worker-1',
      displayName: 'Caner Y.',
      latitude: 40.99,
      longitude: 29.03,
      reliabilityScore: 95,
      occupationCodes: ['barista'],
      hasConflict: false,
      employerAffinityScore: 0.8,
      isReadyNow: true,
    };

    it('scores high for nearby candidate with high reliability and ready toggle', () => {
      const score = scoreEmergencyCandidate(baseCandidate, 0.5, 5.0);
      expect(score).toBeGreaterThan(0.8);
    });

    it('returns zero for candidate with schedule conflict', () => {
      const conflicting = { ...baseCandidate, hasConflict: true };
      const score = scoreEmergencyCandidate(conflicting, 0.5, 5.0);
      expect(score).toBe(0);
    });

    it('penalizes candidates at the edge of the isochrone radius', () => {
      const closeScore = scoreEmergencyCandidate(baseCandidate, 0.2, 5.0);
      const farScore = scoreEmergencyCandidate(baseCandidate, 4.8, 5.0);
      expect(closeScore).toBeGreaterThan(farScore);
    });
  });

  describe('buildEmergencyDispatchPackage', () => {
    const context: EmergencyShiftContext = {
      shiftId: 'shift-sos-1',
      jobId: 'job-1',
      branchId: 'branch-1',
      branchName: 'Karaköy Roastery',
      branchLatitude: 41.0232,
      branchLongitude: 28.9744,
      basePayAmountTry: 1200,
      startsAt: new Date('2026-10-14T18:00:00Z'),
      endsAt: new Date('2026-10-14T23:00:00Z'),
      requiredOccupationCode: 'barista',
    };

    const candidates: EmergencyCandidate[] = [
      {
        workerUserId: 'w-close-pro',
        displayName: 'Ahmet B.',
        latitude: 41.025, // ~300m away
        longitude: 28.976,
        reliabilityScore: 98,
        occupationCodes: ['barista'],
        hasConflict: false,
        isReadyNow: true,
      },
      {
        workerUserId: 'w-far',
        displayName: 'Mehmet C.',
        latitude: 41.15, // >10km away
        longitude: 29.1,
        reliabilityScore: 100,
        occupationCodes: ['barista'],
        hasConflict: false,
      },
      {
        workerUserId: 'w-unqualified',
        displayName: 'Ali D.',
        latitude: 41.024,
        longitude: 28.975,
        reliabilityScore: 90,
        occupationCodes: ['courier'], // wrong occupation
        hasConflict: false,
      },
      {
        workerUserId: 'w-conflicted',
        displayName: 'Burak E.',
        latitude: 41.024,
        longitude: 28.975,
        reliabilityScore: 95,
        occupationCodes: ['barista'],
        hasConflict: true, // already booked
      },
    ];

    it('correctly filters disqualified candidates and offers surge pay to top candidate', () => {
      const now = new Date('2026-10-14T17:30:00Z'); // 30 mins before shift
      const pkg = buildEmergencyDispatchPackage(context, candidates, { now });

      expect(pkg.shiftId).toBe('shift-sos-1');
      expect(pkg.urgencyMinutes).toBe(30);
      expect(pkg.surgeMultiplier).toBe(1.38);
      expect(pkg.emergencyPayTry).toBe(1656); // 1200 * 1.38
      expect(pkg.candidatesDispatched.length).toBe(1);

      const top = pkg.candidatesDispatched[0];
      expect(top.workerUserId).toBe('w-close-pro');
      expect(top.rank).toBe(1);
      expect(top.distanceKm).toBeLessThan(1.0);
      expect(top.offeredPayAmountTry).toBe(1656);
    });
  });
});
