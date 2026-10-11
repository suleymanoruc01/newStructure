import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';

export function normalizePhoneE164(input: string): string {
  const digits = input.replace(/\s+/g, '').replace(/[()-]/g, '');
  if (digits.startsWith('+')) {
    if (!/^\+\d{10,15}$/.test(digits)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Geçersiz telefon numarası.',
      );
    }
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+90${digits.slice(1)}`;
  }
  if (/^\d{10}$/.test(digits)) {
    return `+90${digits}`;
  }
  throw new ApiException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    'Geçersiz telefon numarası.',
  );
}
