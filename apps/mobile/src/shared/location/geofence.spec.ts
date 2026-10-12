import {
  DEFAULT_GEOFENCE_RADII,
  evaluateGeofencePreview,
  haversineM,
} from './geofence';

const branch = { branchLatitude: 41.02, branchLongitude: 28.97 };

test('inside GPS within radius and accuracy', () => {
  const result = evaluateGeofencePreview(
    {
      ...branch,
      latitude: 41.02,
      longitude: 28.97,
      accuracyM: 10,
      locationSource: 'gps',
    },
    { radiusM: 50, softRadiusM: 150, maxAccuracyM: 30 },
  );
  expect(result.inside).toBe(true);
  expect(result.softPass).toBe(false);
  expect(result.distanceM).toBeLessThan(1);
});

test('network location never passes preview', () => {
  const result = evaluateGeofencePreview(
    {
      ...branch,
      latitude: 41.02,
      longitude: 28.97,
      accuracyM: 10,
      locationSource: 'network',
    },
    { radiusM: 50, softRadiusM: 150, maxAccuracyM: 30 },
  );
  expect(result.inside).toBe(false);
  expect(result.softPass).toBe(false);
});

test('~120 m is soft, not inside, at 50 m hard radius', () => {
  const south = 41.02 - 120 / 111_000;
  const result = evaluateGeofencePreview(
    {
      ...branch,
      latitude: south,
      longitude: 28.97,
      accuracyM: 10,
      locationSource: 'gps',
    },
    { radiusM: 50, softRadiusM: 150, maxAccuracyM: 30 },
  );
  expect(haversineM(41.02, 28.97, south, 28.97)).toBeGreaterThan(100);
  expect(result.inside).toBe(false);
  expect(result.softPass).toBe(true);
});

test('default radii match platform fallback', () => {
  expect(DEFAULT_GEOFENCE_RADII).toEqual({
    radiusM: 100,
    softRadiusM: 150,
    maxAccuracyM: 30,
  });
});
