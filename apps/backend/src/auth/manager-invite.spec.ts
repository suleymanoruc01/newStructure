import { describe, expect, it, vi } from 'vitest';

import {
  hashManagerJoinCode,
  revealManagerJoinCode,
  sealManagerJoinCode,
} from './auth.crypto.js';
import { allocateUnusedManagerJoinCode } from './manager-invite.js';

describe('allocateUnusedManagerJoinCode', () => {
  it('retries when the hash is already used', async () => {
    const first = { joinCode: '', codeHash: '' };
    let calls = 0;
    const db = {
      workplaceManagerInvite: {
        findFirst: vi.fn(async ({ where }: { where: { codeHash: string } }) => {
          calls += 1;
          if (calls === 1) {
            first.codeHash = where.codeHash;
            return { id: 'taken' };
          }
          return null;
        }),
      },
      branchManagerInvite: {
        findFirst: vi.fn(async () => null),
      },
    };
    const allocated = await allocateUnusedManagerJoinCode(db, 'pepper');
    expect(allocated.codeHash).toBe(
      hashManagerJoinCode(allocated.joinCode, 'pepper'),
    );
    expect(allocated.codeHash).not.toBe(first.codeHash);
    expect(calls).toBeGreaterThan(1);
  });
});

describe('sealManagerJoinCode', () => {
  it('round-trips and leaves plaintext readable', () => {
    const sealed = sealManagerJoinCode('AB2K3N4P', 'pepper');
    expect(sealed.startsWith('v1:')).toBe(true);
    expect(revealManagerJoinCode(sealed, 'pepper')).toBe('AB2K3N4P');
    expect(revealManagerJoinCode('PLAINCODE', 'pepper')).toBe('PLAINCODE');
  });
});
