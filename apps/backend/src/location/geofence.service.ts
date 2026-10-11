import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { haversineKm } from '../common/distance.util.js';
import { AppConfigService } from '../config/app-config.service.js';

export type GeofenceInput = {
  branchLatitude: number;
  branchLongitude: number;
  latitude: number;
  longitude: number;
  accuracyM: number;
  mockLocation?: boolean;
  locationPermissionGranted: boolean;
};

export type GeofenceResult = {
  distanceM: number;
  inside: boolean;
  softPass: boolean;
};

@Injectable()
export class GeofenceService {
  constructor(private readonly config: AppConfigService) {}

  evaluate(input: GeofenceInput): GeofenceResult {
    if (!input.locationPermissionGranted) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Konum izni gerekli.',
      );
    }
    if (input.mockLocation) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.MOCK_LOCATION_DETECTED,
        'Sahte konum algılandı.',
      );
    }

    const distanceM =
      haversineKm(
        input.latitude,
        input.longitude,
        input.branchLatitude,
        input.branchLongitude,
      ) * 1000;

    const radiusM = this.config.env.GEOFENCE_RADIUS_M;
    const softRadiusM = this.config.env.GEOFENCE_SOFT_RADIUS_M;
    const maxAccuracyM = this.config.env.GEOFENCE_MAX_ACCURACY_M;

    const inside = distanceM <= radiusM;
    const softPass =
      !inside &&
      distanceM <= softRadiusM &&
      input.accuracyM <= maxAccuracyM;

    return { distanceM, inside, softPass };
  }

  assertInsideOrSoft(result: GeofenceResult): void {
    if (result.inside || result.softPass) {
      return;
    }
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.OUTSIDE_GEOFENCE,
      'Şube alanı dışındasınız.',
    );
  }
}
