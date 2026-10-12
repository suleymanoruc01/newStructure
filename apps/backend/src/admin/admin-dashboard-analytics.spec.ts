import { describe, expect, it } from 'vitest';

import {
  bucketCountsByDay,
  estimateTopUpRevenueTry,
  istanbulDayKey,
  lastNDayKeys,
} from './admin-dashboard-analytics.js';

describe('admin-dashboard-analytics', () => {
  it('estimateTopUpRevenueTry uses package price when ref is token_package', () => {
    const packages = new Map([
      ['pkg-1', { priceTry: 1000, tokenCount: 50 }],
    ]);
    const revenue = estimateTopUpRevenueTry(
      [{ amount: 55, refType: 'token_package', refId: 'pkg-1' }],
      packages,
    );
    expect(revenue).toBe(1000);
  });

  it('bucketCountsByDay aligns with istanbul day keys', () => {
    const keys = lastNDayKeys(3);
    expect(keys).toHaveLength(3);
    const counts = bucketCountsByDay([], keys);
    expect(counts).toEqual([0, 0, 0]);
    expect(istanbulDayKey(new Date())).toBe(keys[keys.length - 1]);
  });
});
