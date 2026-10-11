import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from './api.exception.js';

export function assertValidCoordinates(
  latitude: number,
  longitude: number,
): void {
  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_COORDINATES,
      'Geçersiz koordinat.',
    );
  }
  if (latitude === 0 && longitude === 0) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_COORDINATES,
      'Geçersiz koordinat.',
    );
  }
}
