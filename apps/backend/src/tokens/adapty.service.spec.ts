import { describe, expect, it } from 'vitest';

import { adaptyActive, profileHasTransaction } from './adapty.service.js';

describe('Adapty helpers', () => {
  it('is inactive without keys', () => {
    expect(
      adaptyActive({ enabled: true, publicSdkKey: 'pub', secretKey: '' }),
    ).toBe(false);
  });

  it('matches a store transaction on the profile payload', () => {
    const profile = {
      data: {
        non_subscriptions: {
          tokens_10: [
            {
              purchase_id: 'txn-abc',
              vendor_product_id: 'parton_tokens_10',
            },
          ],
        },
      },
    };
    expect(
      profileHasTransaction(profile, 'txn-abc', ['parton_tokens_10']),
    ).toBe(true);
    expect(profileHasTransaction(profile, 'txn-other', ['parton_tokens_10'])).toBe(
      false,
    );
  });
});
