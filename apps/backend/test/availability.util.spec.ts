import { describe, expect, it } from 'vitest';

import { assertAvailabilityWindowsValid } from '../src/workers/availability.util.js';

describe('assertAvailabilityWindowsValid', () => {
  it('allows non-overlapping windows on the same day', () => {
    expect(() =>
      assertAvailabilityWindowsValid([
        { dayOfWeek: 1, startMinute: 540, endMinute: 720 },
        { dayOfWeek: 1, startMinute: 780, endMinute: 900 },
      ]),
    ).not.toThrow();
  });

  it('rejects overlapping windows on the same day', () => {
    expect(() =>
      assertAvailabilityWindowsValid([
        { dayOfWeek: 1, startMinute: 540, endMinute: 800 },
        { dayOfWeek: 1, startMinute: 700, endMinute: 900 },
      ]),
    ).toThrow();
  });
});
