import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FALLBACK_OTP,
  SmsService,
  VERIMOR_OTP_URL,
  buildVerimorOtpBody,
  verimorActive,
  verimorDest,
} from './sms.service.js';

describe('Verimor OTP payload', () => {
  it('strips + from E.164 dest and omits empty header', () => {
    expect(verimorDest('+905001234567')).toBe('905001234567');
    expect(verimorActive({ verimorEnabled: true, username: '', password: 'x' })).toBe(
      false,
    );
    expect(FALLBACK_OTP).toBe('290821');
    const body = buildVerimorOtpBody({
      username: '08505320000',
      password: 'secret',
      header: '  ',
      phoneE164: '+905001234567',
      code: '482931',
      customId: 'islem-uuid-001',
    });
    expect(body.dest).toBe('905001234567');
    expect(body.header).toBeUndefined();
    expect(body.msg).toContain('{code}');
    expect(body.custom_id).toBe('islem-uuid-001');
  });
});

describe('SmsService.sendOtp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not call Verimor when disabled', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const sms = new SmsService({
      smsSettings: {
        findUnique: vi.fn().mockResolvedValue({
          verimorEnabled: false,
          username: 'user',
          password: 'secret',
          header: 'PARTON',
        }),
      },
    } as never);
    await sms.sendOtp('+905001234567', '482931');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs /v2/otp when Verimor is active', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'campaign-1',
    });
    vi.stubGlobal('fetch', fetchSpy);
    const sms = new SmsService({
      smsSettings: {
        findUnique: vi.fn().mockResolvedValue({
          verimorEnabled: true,
          username: '08505320000',
          password: 'secret',
          header: 'PARTON',
        }),
      },
    } as never);
    await sms.sendOtp('+905001234567', '482931', 'challenge-id');
    expect(fetchSpy).toHaveBeenCalledWith(
      VERIMOR_OTP_URL,
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(
      (fetchSpy.mock.calls[0][1] as { body: string }).body,
    ) as Record<string, string>;
    expect(body.dest).toBe('905001234567');
    expect(body.code).toBe('482931');
    expect(body.header).toBe('PARTON');
    expect(body.custom_id).toBe('challenge-id');
  });
});
