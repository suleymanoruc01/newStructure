import { describe, expect, it } from 'vitest';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { GeofenceService } from './geofence.service.js';

describe('GeofenceService T-144', () => {
  const service = new GeofenceService({
    env: {
      GEOFENCE_RADIUS_M: 50,
      GEOFENCE_SOFT_RADIUS_M: 150,
      GEOFENCE_MAX_ACCURACY_M: 30,
    },
  } as AppConfigService);

  const inside = {
    branchLatitude: 41.02,
    branchLongitude: 28.97,
    latitude: 41.02,
    longitude: 28.97,
    accuracyM: 10,
    locationPermissionGranted: true,
  };

  it('lets GPS inside the radius pass', () => {
    const result = service.evaluate({ ...inside, locationSource: 'gps' });
    expect(result.inside).toBe(true);
  });

  it('rejects network/Wi-Fi even when coordinates are inside', () => {
    expect(() =>
      service.evaluate({ ...inside, locationSource: 'network' }),
    ).toThrow(ApiException);
    try {
      service.evaluate({ ...inside, locationSource: 'network' });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).code).toBe('OUTSIDE_GEOFENCE');
    }
  });
});
