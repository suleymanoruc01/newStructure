import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AdaptyService,
  adaptyActive,
  profileHasTransaction,
} from './adapty.service.js';

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

describe('AdaptyService.probe', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is degraded when Adapty is off', async () => {
    const service = new AdaptyService({
      adaptySettings: {
        findUnique: vi.fn().mockResolvedValue({
          enabled: false,
          publicSdkKey: '',
          secretKey: '',
        }),
      },
    } as never);
    const probe = await service.probe();
    expect(probe.status).toBe('degraded');
  });

  it('is down when the secret is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 401, ok: false }),
    );
    const service = new AdaptyService({
      adaptySettings: {
        findUnique: vi.fn().mockResolvedValue({
          enabled: true,
          publicSdkKey: 'pub',
          secretKey: 'bad',
        }),
      },
    } as never);
    const probe = await service.probe();
    expect(probe.status).toBe('down');
    expect(probe.detail).toContain('401');
  });
});
