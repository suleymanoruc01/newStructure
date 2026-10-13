import { describe, expect, it } from 'vitest';

import { parseManagerPermissions } from './manager-permissions.js';

describe('parseManagerPermissions', () => {
  it('keeps known permissions and drops junk', () => {
    expect(
      parseManagerPermissions([
        'jobs.create',
        'jobs.delete',
        'not-a-perm',
        'jobs.create',
      ]),
    ).toEqual(['jobs.create', 'jobs.delete']);
  });

  it('returns empty for non-arrays', () => {
    expect(parseManagerPermissions(null)).toEqual([]);
    expect(parseManagerPermissions({ jobs: true })).toEqual([]);
  });
});
