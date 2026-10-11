import { describe, expect, it } from 'vitest';

import {
  availabilityCoversJob,
  jobRequiresNightShiftAvailability,
} from '../src/matching/job-availability-coverage.util.js';

describe('job-availability-coverage', () => {
  it('covers same-day job within window', () => {
    const startsAt = new Date('2026-10-15T10:00:00.000Z');
    const endsAt = new Date('2026-10-15T18:00:00.000Z');
    const day = startsAt.getUTCDay();
    const ok = availabilityCoversJob(
      [
        {
          dayOfWeek: day,
          startMinute: 9 * 60,
          endMinute: 19 * 60,
          crossesMidnight: false,
        },
      ],
      startsAt,
      endsAt,
    );
    expect(ok).toBe(true);
  });

  it('covers cross-midnight job with overnight window', () => {
    const startsAt = new Date('2026-10-15T23:00:00.000Z');
    const endsAt = new Date('2026-10-16T05:00:00.000Z');
    const day = startsAt.getUTCDay();
    const ok = availabilityCoversJob(
      [
        {
          dayOfWeek: day,
          startMinute: 22 * 60,
          endMinute: 6 * 60,
          crossesMidnight: true,
        },
      ],
      startsAt,
      endsAt,
    );
    expect(ok).toBe(true);
    expect(jobRequiresNightShiftAvailability(startsAt, endsAt)).toBe(true);
  });
});
