import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

import { ApiClientError } from '../../api/client';
import { mayRequestLocation } from '../privacy/permission-moment';

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
  accuracyM: number;
  locationPermissionGranted: boolean;
  mockLocation: boolean;
};

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export async function readDeviceCoordinates(): Promise<DeviceCoordinates> {
  if (!mayRequestLocation('check-in')) {
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
      (position) => {
        const coords = position.coords as {
          latitude: number;
          longitude: number;
          accuracy?: number;
          mocked?: boolean;
        };
        const mockedFromPosition =
          typeof position.mocked === 'boolean' ? position.mocked : false;
        const mocked =
          mockedFromPosition || Boolean(coords.mocked);
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyM: coords.accuracy ?? 20,
          locationPermissionGranted: true,
          mockLocation: mocked,
        });
      },
      () => {
        reject(
          new ApiClientError(
            'Konum alınamadı.',
            422,
            'LOCATION_UNAVAILABLE',
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
    );
  });
}
