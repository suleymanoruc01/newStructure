import { describe, expect, it } from 'vitest';
import {
  computeContainmentProbability,
  computeKinematicVelocityKmh,
  erf,
  verifySpatialContainment,
} from './spatial-verification.util.js';

describe('spatial-verification.util', () => {
  describe('erf (Error Function)', () => {
    it('accurately approximates error function values', () => {
      expect(erf(0)).toBe(0);
      expect(erf(1)).toBeCloseTo(0.8427, 3);
      expect(erf(-1)).toBeCloseTo(-0.8427, 3);
      expect(erf(2)).toBeCloseTo(0.9953, 3);
    });
  });

  describe('computeContainmentProbability', () => {
    it('returns 1.0 when right at the center of the venue', () => {
      const prob = computeContainmentProbability(0, 15, 100);
      expect(prob).toBe(1.0);
    });

    it('returns 0.5 when measured distance equals the nominal radius', () => {
      const prob = computeContainmentProbability(100, 20, 100);
      expect(prob).toBe(0.5);
    });

    it('smoothly discounts probability when measured distance exceeds radius', () => {
      const probInside = computeContainmentProbability(80, 20, 100);
      const probBoundary = computeContainmentProbability(100, 20, 100);
      const probOutside = computeContainmentProbability(120, 20, 100);

      expect(probInside).toBeGreaterThan(probBoundary);
      expect(probBoundary).toBeGreaterThan(probOutside);
    });
  });

  describe('computeKinematicVelocityKmh', () => {
    it('detects normal walking/commute speed without anomaly', () => {
      // 100 meters in 60 seconds = 6 km/h
      const p1 = {
        latitude: 41.0082,
        longitude: 28.9784,
        accuracyM: 10,
        timestampMs: 1000000,
      };
      const p2 = {
        latitude: 41.0091,
        longitude: 28.9784,
        accuracyM: 10,
        timestampMs: 1060000,
      };

      const result = computeKinematicVelocityKmh(p1, p2);
      expect(result.anomaly).toBe(false);
      expect(result.speedKmh).toBeLessThan(20);
    });

    it('flags GPS teleportation when speed exceeds 160 km/h', () => {
      // 10 km in 30 seconds = 1200 km/h
      const p1 = {
        latitude: 41.0082,
        longitude: 28.9784,
        accuracyM: 10,
        timestampMs: 1000000,
      };
      const p2 = {
        latitude: 41.0982, // ~10 km away
        longitude: 28.9784,
        accuracyM: 10,
        timestampMs: 1030000,
      };

      const result = computeKinematicVelocityKmh(p1, p2);
      expect(result.anomaly).toBe(true);
      expect(result.speedKmh).toBeGreaterThan(160);
    });
  });

  describe('verifySpatialContainment', () => {
    const venue = {
      branchLatitude: 41.0082,
      branchLongitude: 28.9784,
      nominalRadiusM: 100,
      softRadiusM: 150,
    };

    it('verifies pass for worker cleanly inside the venue', () => {
      const result = verifySpatialContainment({
        currentPoint: {
          latitude: 41.0083,
          longitude: 28.9784,
          accuracyM: 10,
          timestampMs: Date.now(),
        },
        ...venue,
      });

      expect(result.decision).toBe('verified_pass');
      expect(result.confidenceTier).toBe('high_confidence_inside');
      expect(result.containmentProbability).toBeGreaterThan(0.8);
    });

    it('allows soft_pass for marginal boundary detection within soft radius', () => {
      // ~120m away from venue
      const result = verifySpatialContainment({
        currentPoint: {
          latitude: 41.0093,
          longitude: 28.9784,
          accuracyM: 25,
          timestampMs: Date.now(),
        },
        ...venue,
      });

      expect(result.decision).toBe('soft_pass');
      expect(result.distanceM).toBeGreaterThan(venue.nominalRadiusM);
      expect(result.distanceM).toBeLessThanOrEqual(venue.softRadiusM);
    });

    it('rejects worker who is completely outside the soft radius', () => {
      // 500m away
      const result = verifySpatialContainment({
        currentPoint: {
          latitude: 41.0130,
          longitude: 28.9784,
          accuracyM: 10,
          timestampMs: Date.now(),
        },
        ...venue,
      });

      expect(result.decision).toBe('reject');
      expect(result.confidenceTier).toBe('outside');
    });

    it('rejects check-in immediately when kinematic teleportation is detected', () => {
      const now = Date.now();
      const previousPoint = {
        latitude: 40.9000, // 15 km away
        longitude: 28.9000,
        accuracyM: 10,
        timestampMs: now - 10000, // 10 seconds ago
      };

      const result = verifySpatialContainment({
        currentPoint: {
          latitude: venue.branchLatitude,
          longitude: venue.branchLongitude,
          accuracyM: 10,
          timestampMs: now,
        },
        previousPoint,
        ...venue,
      });

      expect(result.decision).toBe('reject');
      expect(result.teleportationAnomaly).toBe(true);
      expect(result.mockLocationDetected).toBe(true);
    });
  });
});
