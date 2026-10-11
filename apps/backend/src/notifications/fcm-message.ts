import type { Message } from 'firebase-admin/messaging';

export type PushCategory =
  | 'applications'
  | 'shifts'
  | 'matching'
  | 'favorites'
  | 'marketing';

export function categoryForType(type: string): PushCategory {
  if (type.startsWith('shift.')) {
    return 'shifts';
  }
  if (type.startsWith('job.matched') || type.startsWith('job.favorite')) {
    return 'matching';
  }
  if (type.startsWith('job.favorites_only')) {
    return 'favorites';
  }
  return 'applications';
}

export function androidChannelId(category: PushCategory): string {
  if (category === 'shifts') {
    return 'shifts';
  }
  if (category === 'applications') {
    return 'applications';
  }
  return 'default';
}

export function buildFcmMessage(input: {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
  type: string;
  notificationId: string;
}): Message {
  const channelId = androidChannelId(categoryForType(input.type));
  return {
    token: input.token,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    android: {
      priority: 'high',
      notification: {
        channelId,
        tag: input.notificationId,
        sound: 'default',
      },
    },
    apns: {
      headers: {
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-collapse-id': input.notificationId,
      },
      payload: {
        aps: {
          sound: 'default',
          alert: {
            title: input.title,
            body: input.body,
          },
        },
      },
    },
  };
}
