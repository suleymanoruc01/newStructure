export type FeedCursorPayload = {
  startsAt: string;
  id: string;
};

export function encodeFeedCursor(payload: FeedCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeFeedCursor(raw: string | undefined): FeedCursorPayload | null {
  if (!raw) {
    return null;
  }
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as FeedCursorPayload;
    if (!parsed.id || !parsed.startsAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
