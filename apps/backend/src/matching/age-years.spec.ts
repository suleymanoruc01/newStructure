import { describe, expect, it } from 'vitest';

import { istanbulCivil, istanbulInstant } from '../common/istanbul-civil.js';
import { ageYearsAt } from './matching.service.js';

describe('ageYearsAt', () => {
  it('counts full years and waits for the birthday', () => {
    const birth = new Date('2000-06-15T00:00:00.000Z');
    expect(ageYearsAt(birth, new Date('2026-06-14T12:00:00.000Z'))).toBe(25);
    expect(ageYearsAt(birth, new Date('2026-06-14T21:30:00.000Z'))).toBe(26);
    expect(ageYearsAt(birth, new Date('2026-06-15T00:00:00.000Z'))).toBe(26);
  });

  it('builds 00:30 as Europe/Istanbul, not a fixed offset string', () => {
    const at = istanbulInstant(2026, 6, 15, 0, 30);
    expect(istanbulCivil(at)).toMatchObject({
      year: 2026,
      month: 6,
      day: 15,
      minutes: 30,
    });
  });
});
