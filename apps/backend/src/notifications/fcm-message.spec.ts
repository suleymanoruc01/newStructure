import { describe, expect, it } from 'vitest';

import { buildFcmMessage } from './fcm-message.js';

const base = {
  token: 't'.repeat(40),
  title: 'Başlık',
  body: 'Gövde',
  data: { notificationId: 'n1', type: 'shift.checkin_due', v: '1' },
  notificationId: 'n1',
};

describe('buildFcmMessage', () => {
  it('uses the shifts channel on Android and an alert on iOS', () => {
    const message = buildFcmMessage({ ...base, type: 'shift.checkin_due' });
    expect(message.android?.notification?.channelId).toBe('shifts');
    expect(message.apns?.headers?.['apns-push-type']).toBe('alert');
    expect(message.apns?.headers?.['apns-priority']).toBe('10');
  });

  it('keeps matching and favorites off the applications channel', () => {
    expect(
      buildFcmMessage({ ...base, type: 'job.matched' }).android?.notification
        ?.channelId,
    ).toBe('default');
    expect(
      buildFcmMessage({ ...base, type: 'application.received' }).android
        ?.notification?.channelId,
    ).toBe('applications');
  });
});
