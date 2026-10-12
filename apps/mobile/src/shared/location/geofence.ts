const EARTH_RADIUS_M = 6_371_000;

export type GeofenceRadii = {
  radiusM: number;
  softRadiusM: number;
  maxAccuracyM: number;
};

/** Matches Nest `platform.service` when remote-config row is missing. */
export const DEFAULT_GEOFENCE_RADII: GeofenceRadii = {
  radiusM: 100,
  softRadiusM: 150,
  maxAccuracyM: 30,
};

export function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export type GeofencePreviewInput = {
  branchLatitude: number;
  branchLongitude: number;
  latitude: number;
  longitude: number;
  accuracyM: number;
  locationSource?: 'gps' | 'network';
};

export type GeofencePreview = {
  distanceM: number;
  inside: boolean;
  softPass: boolean;
  accurate: boolean;
};

/** Client preview only — server GeofenceService is the pass/fail SoR. */
export function evaluateGeofencePreview(
  input: GeofencePreviewInput,
  radii: GeofenceRadii = DEFAULT_GEOFENCE_RADII,
): GeofencePreview {
  const distanceM = haversineM(
    input.latitude,
    input.longitude,
    input.branchLatitude,
    input.branchLongitude,
  );
  if (input.locationSource === 'network') {
    return { distanceM, inside: false, softPass: false, accurate: false };
  }
  const accurate = input.accuracyM <= radii.maxAccuracyM;
  const inside = distanceM <= radii.radiusM && accurate;
  const softPass = !inside && distanceM <= radii.softRadiusM;
  return { distanceM, inside, softPass, accurate };
}

export function mapRegion(
  latitude: number,
  longitude: number,
  radiusM = DEFAULT_GEOFENCE_RADII.softRadiusM,
) {
  const span =
    Number.isFinite(radiusM) && radiusM > 0
      ? radiusM
      : DEFAULT_GEOFENCE_RADII.softRadiusM;
  const meters = Math.max(span * 3, 250);
  const latitudeDelta = meters / 111_000;
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}

export const ISTANBUL_PIN = { latitude: 41.0082, longitude: 28.9784 };

export function finitePin(
  pin: { latitude?: number | null; longitude?: number | null } | null | undefined,
): { latitude: number; longitude: number } | null {
  const latitude = pin?.latitude;
  const longitude = pin?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}
