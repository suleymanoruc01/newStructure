import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

import { ApiClientError } from '../../api/client';
import {
  mayRequestLocation,
  type PermissionMoment,
} from '../privacy/permission-moment';

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false,
  locationProvider: 'auto',
});

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
  accuracyM: number;
  locationPermissionGranted: boolean;
  mockLocation: boolean;
  locationSource: 'gps';
};

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return new Promise((resolve) => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

function fromPosition(position: GeolocationResponse): DeviceCoordinates {
  const extra = position as GeolocationResponse & { mocked?: boolean };
  const coords = extra.coords as GeolocationResponse['coords'] & {
    mocked?: boolean;
  };
  const mockedFromPosition = typeof extra.mocked === 'boolean' ? extra.mocked : false;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyM: coords.accuracy ?? 20,
    locationPermissionGranted: true,
    mockLocation: mockedFromPosition || Boolean(coords.mocked),
    locationSource: 'gps',
  };
}

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 5_000,
  distanceFilter: 5,
};

export async function readDeviceCoordinates(
  moment: PermissionMoment,
): Promise<DeviceCoordinates> {
  if (!mayRequestLocation(moment)) {
    throw new ApiClientError(
      'Konum izni bu adımda istenmez.',
      403,
      'LOCATION_PERMISSION_DENIED',
    );
  }
  const permissionGranted = await ensureLocationPermission();
  if (!permissionGranted) {
    throw new ApiClientError(
      'Konum izni gerekli.',
      403,
      'LOCATION_PERMISSION_DENIED',
    );
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(fromPosition(position)),
      () => {
        reject(
          new ApiClientError(
            'Konum alınamadı.',
            422,
            'LOCATION_UNAVAILABLE',
          ),
        );
      },
      GPS_OPTIONS,
    );
  });
}

export function watchDeviceCoordinates(
  moment: PermissionMoment,
  onSample: (coords: DeviceCoordinates) => void,
  onError: (err: ApiClientError) => void,
): () => void {
  let cancelled = false;
  let watchId: number | null = null;
  void (async () => {
    try {
      if (!mayRequestLocation(moment)) {
        throw new ApiClientError(
          'Konum izni bu adımda istenmez.',
          403,
          'LOCATION_PERMISSION_DENIED',
        );
      }
      const permissionGranted = await ensureLocationPermission();
      if (cancelled) {
        return;
      }
      if (!permissionGranted) {
        throw new ApiClientError(
          'Konum izni gerekli.',
          403,
          'LOCATION_PERMISSION_DENIED',
        );
      }
      watchId = Geolocation.watchPosition(
        (position) => onSample(fromPosition(position)),
        () =>
          onError(
            new ApiClientError(
              'Konum alınamadı.',
              422,
              'LOCATION_UNAVAILABLE',
            ),
          ),
        GPS_OPTIONS,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        onError(err);
      } else {
        onError(
          new ApiClientError(
            'Konum alınamadı.',
            422,
            'LOCATION_UNAVAILABLE',
          ),
        );
      }
    }
  })();
  return () => {
    cancelled = true;
    if (watchId != null) {
      Geolocation.clearWatch(watchId);
    }
  };
}
