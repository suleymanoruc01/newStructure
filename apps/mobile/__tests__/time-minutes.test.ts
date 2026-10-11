import {
  DAY_NAMES_TR,
  formatMinuteOfDay,
  parseTimeToMinute,
} from '../src/shared/availability/time-minutes';

describe('time-minutes', () => {
  it('formats and parses minute-of-day values', () => {
    expect(formatMinuteOfDay(0)).toBe('00:00');
    expect(formatMinuteOfDay(90)).toBe('01:30');
    expect(parseTimeToMinute('14:15')).toBe(14 * 60 + 15);
  });

  it('exposes Turkish day names for availability UI', () => {
    expect(DAY_NAMES_TR[1]).toBe('Pazartesi');
    expect(DAY_NAMES_TR).toHaveLength(7);
  });
});
