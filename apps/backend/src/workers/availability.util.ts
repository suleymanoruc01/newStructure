import { HttpStatus } from '@nestjs/common';
import { ErrorCode, type AvailabilityWindowInput } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';

type Interval = { start: number; end: number };

export function dayIntervals(
  window: AvailabilityWindowInput,
): { day: number; intervals: Interval[] }[] {
  const start = window.startMinute;
  const end = window.endMinute;
  const crosses =
    window.crossesMidnight === true || (end <= start && end !== start);

  if (!crosses) {
    if (end <= start) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Geçersiz saat aralığı.',
      );
    }
    return [{ day: window.dayOfWeek, intervals: [{ start, end }] }];
  }

  const nextDay = (window.dayOfWeek + 1) % 7;
  return [
    { day: window.dayOfWeek, intervals: [{ start, end: 1440 }] },
    { day: nextDay, intervals: [{ start: 0, end }] },
  ];
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function assertAvailabilityWindowsValid(
  windows: AvailabilityWindowInput[],
): void {
  const byDay = new Map<number, Interval[]>();

  for (const window of windows) {
    for (const chunk of dayIntervals(window)) {
      const list = byDay.get(chunk.day) ?? [];
      for (const interval of chunk.intervals) {
        for (const existing of list) {
          if (overlaps(existing, interval)) {
            throw new ApiException(
              HttpStatus.BAD_REQUEST,
              ErrorCode.AVAILABILITY_OVERLAP,
              'Çakışan saat aralıkları kaydedilemez.',
            );
          }
        }
        list.push(interval);
      }
      byDay.set(chunk.day, list);
    }
  }
}
