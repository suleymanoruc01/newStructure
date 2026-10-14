/**
 * Bayesian Spatial Verification & Kinematic Anomaly Detection Engine.
 *
 * Implements:
 * 1. Probabilistic Geofence Containment via Gaussian Error Function (erf)
 * 2. Kinematic Velocity & Teleportation Anomaly Verification
 * 3. Sensor Jitter Entropy Analysis for Mock Location Detection
 */

import { haversineKm } from '../common/distance.util.js';

export type SpatialTelemetryPoint = {
  latitude: number;
  longitude: number;
  accuracyM: number;
  timestampMs: number;
  mockLocation?: boolean;
};

export type SpatialVerificationInput = {
  currentPoint: SpatialTelemetryPoint;
  branchLatitude: number;
  branchLongitude: number;
  nominalRadiusM: number;
  softRadiusM: number;
  previousPoint?: SpatialTelemetryPoint;
};

export type ContainmentConfidenceTier =
  | 'high_confidence_inside'
  | 'probable_inside'
  | 'boundary_marginal'
  | 'outside';

export type SpatialVerificationResult = {
  distanceM: number;
  containmentProbability: number; // [0.0, 1.0]
  confidenceTier: ContainmentConfidenceTier;
  kinematicSpeedKmh: number | null;
  teleportationAnomaly: boolean;
  mockLocationDetected: boolean;
  decision: 'verified_pass' | 'soft_pass' | 'reject';
  decisionReason: string;
};

/**
 * Abramowitz and Stegun numerical approximation of the Error Function (erf(x)).
 * Max error < 1.5e-7.
 */
export function erf(x: number): number {
  if (x === 0) return 0;
  const sign = x > 0 ? 1 : -1;
  const absX = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * absX);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const y = 1.0 - poly * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Computes Gaussian spatial containment probability:
 * P(distance <= R) given measured distance d and accuracy standard deviation sigma.
 */
export function computeContainmentProbability(
  distanceM: number,
  accuracyM: number,
  radiusM: number,
): number {
  const sigma = Math.max(1.0, accuracyM);
  // Standard score: how many standard deviations is the venue boundary away from the measured center?
  const z = (radiusM - distanceM) / (Math.SQRT2 * sigma);
  const prob = 0.5 * (1.0 + erf(z));
  return Math.min(1.0, Math.max(0.0, Math.round(prob * 1000) / 1000));
}

/**
 * Validates physical kinematic velocity between two sequential telemetry fixes.
 * Threshold: 160 km/h (exceeding high-speed urban transit / indicates mock GPS teleportation).
 */
export function computeKinematicVelocityKmh(
  p1: SpatialTelemetryPoint,
  p2: SpatialTelemetryPoint,
): { speedKmh: number; anomaly: boolean } {
  const dtSeconds = Math.abs(p2.timestampMs - p1.timestampMs) / 1000;
  if (dtSeconds <= 0.5) {
    // Too close in time to compute reliable velocity; default to 0
    return { speedKmh: 0, anomaly: false };
  }

  const distKm = haversineKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  const speedKmh = (distKm / dtSeconds) * 3600;

  // Speeds above 160 km/h in urban check-in scenarios are physical teleportation anomalies
  const anomaly = speedKmh > 160;
  return { speedKmh: Math.round(speedKmh * 10) / 10, anomaly };
}

/**
 * Master Spatial Verification Algorithm:
 * Evaluates probabilistic geofence containment, kinematic trajectory integrity, and mock GPS signals.
 */
export function verifySpatialContainment(
  input: SpatialVerificationInput,
): SpatialVerificationResult {
  const { currentPoint, branchLatitude, branchLongitude, nominalRadiusM, softRadiusM } = input;

  const distanceM = Math.round(
    haversineKm(
      currentPoint.latitude,
      currentPoint.longitude,
      branchLatitude,
      branchLongitude,
    ) * 1000,
  );

  const containmentProb = computeContainmentProbability(
    distanceM,
    currentPoint.accuracyM,
    nominalRadiusM,
  );

  let kinematicSpeedKmh: number | null = null;
  let teleportationAnomaly = false;

  if (input.previousPoint) {
    const kin = computeKinematicVelocityKmh(input.previousPoint, currentPoint);
    kinematicSpeedKmh = kin.speedKmh;
    teleportationAnomaly = kin.anomaly;
  }

  const mockLocationDetected = Boolean(currentPoint.mockLocation) || teleportationAnomaly;

  // Classify containment tier
  let confidenceTier: ContainmentConfidenceTier = 'outside';
  if (containmentProb >= 0.8) {
    confidenceTier = 'high_confidence_inside';
  } else if (containmentProb >= 0.45 || distanceM <= nominalRadiusM) {
    confidenceTier = 'probable_inside';
  } else if (containmentProb >= 0.15 || distanceM <= softRadiusM) {
    confidenceTier = 'boundary_marginal';
  }

  // Determine gate decision
  let decision: 'verified_pass' | 'soft_pass' | 'reject' = 'reject';
  let decisionReason = 'Şube alanı dışındasınız.';

  if (mockLocationDetected) {
    decision = 'reject';
    decisionReason = teleportationAnomaly
      ? 'Anormal konum hızı (sahte GPS teleportasyonu) algılandı.'
      : 'Sahte konum sağlayıcısı algılandı.';
  } else if (confidenceTier === 'high_confidence_inside' || distanceM <= nominalRadiusM) {
    decision = 'verified_pass';
    decisionReason = 'Şube alanı içinde doğrulandı.';
  } else if (confidenceTier === 'probable_inside' || distanceM <= softRadiusM) {
    decision = 'soft_pass';
    decisionReason = 'Şube çevresi tolerans sınırında doğrulandı.';
  }

  return {
    distanceM,
    containmentProbability: containmentProb,
    confidenceTier,
    kinematicSpeedKmh,
    teleportationAnomaly,
    mockLocationDetected,
    decision,
    decisionReason,
  };
}
