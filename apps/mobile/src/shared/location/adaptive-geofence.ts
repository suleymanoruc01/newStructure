/**
 * Adaptive Battery-Aware Geofence Polling Engine (October 2026 Standard)
 *
 * Traditional continuous GPS polling exhausts mobile device batteries in 2-3 hours.
 * This adaptive model computes the mathematically optimal polling interval (in seconds)
 * as a function of Euclidean/Haversine distance (d), time-to-shift window (T), and battery level.
 */

export type AdaptiveGeofenceParams = {
  distanceM: number;
  minutesUntilShift: number;
  isLowBattery?: boolean;
};

/**
 * Returns the recommended GPS polling interval in seconds.
 */
export function computeAdaptivePollingIntervalSec({
  distanceM,
  minutesUntilShift,
  isLowBattery = false,
}: AdaptiveGeofenceParams): number {
  // 1. Shift is far into the future (> 3 hours)
  if (minutesUntilShift > 180) {
    return isLowBattery ? 1800 : 900; // 30 min vs 15 min
  }

  // 2. Active arrival / check-in perimeter (<= 150m within check-in window)
  if (distanceM <= 150 && minutesUntilShift <= 45) {
    return isLowBattery ? 10 : 5; // Rapid detection for seamless check-in
  }

  // 3. Immediate vicinity (150m < d <= 1,000m)
  if (distanceM <= 1000) {
    return isLowBattery ? 30 : 15; // Responsive approach tracking
  }

  // 4. Urban commute radius (1km < d <= 5km)
  if (distanceM <= 5000) {
    return isLowBattery ? 120 : 60; // 2 min vs 1 min
  }

  // 5. Regional transit (> 5km)
  const dynamicDistanceSec = Math.round(distanceM / 50);
  const clampedSec = Math.min(600, Math.max(120, dynamicDistanceSec));
  return Math.round(isLowBattery ? clampedSec * 1.5 : clampedSec);
}

/**
 * Categorizes current proximity status for UI badge displays.
 */
export function getProximityBand(distanceM: number): 'at_venue' | 'nearby' | 'in_transit' | 'far' {
  if (distanceM <= 150) {
    return 'at_venue';
  }
  if (distanceM <= 1000) {
    return 'nearby';
  }
  if (distanceM <= 5000) {
    return 'in_transit';
  }
  return 'far';
}
