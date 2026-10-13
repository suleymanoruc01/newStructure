import { describe, expect, it } from 'vitest';

import {
  PUBLIC_CODE_PREFIX,
  isPublicCode,
  newPublicCode,
} from './public-code.js';

describe('public codes', () => {
  it('is 8 chars, mixed alphabet, and prefixed', () => {
    const code = newPublicCode(PUBLIC_CODE_PREFIX.workplace);
    expect(code).toHaveLength(8);
    expect(code.startsWith('TR')).toBe(true);
    expect(isPublicCode(code, 'TR')).toBe(true);
    expect(isPublicCode(code, 'BR')).toBe(false);
    expect(isPublicCode('trXXXXXX')).toBe(false);
  });

  it('draws more than digits from the tail', () => {
    const samples = Array.from({ length: 40 }, () =>
      newPublicCode(PUBLIC_CODE_PREFIX.employer).slice(2),
    );
    expect(samples.some((tail) => /[A-Z]/.test(tail))).toBe(true);
    expect(samples.some((tail) => /[a-z]/.test(tail))).toBe(true);
    expect(samples.some((tail) => /[0-9]/.test(tail))).toBe(true);
  });
});
