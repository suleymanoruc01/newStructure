import { describe, expect, it } from 'vitest';

import { containsProfanity } from './profanity-filter.js';

describe('containsProfanity T-176', () => {
  it('queues Turkish word-list hits and ignores clean copy', () => {
    expect(containsProfanity('orospu davranış')).toBe(true);
    expect(containsProfanity('Harika işveren')).toBe(false);
  });
});
