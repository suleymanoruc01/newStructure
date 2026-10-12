import { fetchPlatformRemoteConfig } from '../../api/platform-api';

import { type GeofenceRadii } from './geofence';

let radiiCache: GeofenceRadii | null = null;

export async function loadGeofenceRadii(): Promise<GeofenceRadii> {
  if (radiiCache) {
    return radiiCache;
  }
  const config = await fetchPlatformRemoteConfig();
  radiiCache = {
    radiusM: config.geofenceRadiusM,
    softRadiusM: config.geofenceSoftRadiusM,
    maxAccuracyM: config.geofenceMaxAccuracyM,
  };
  return radiiCache;
}
