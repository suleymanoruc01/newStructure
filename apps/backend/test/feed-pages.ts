import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';

export async function collectFeedJobIds(
  app: INestApplication,
  accessToken: string,
): Promise<string[]> {
  const ids: string[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  for (;;) {
    const path = cursor
      ? `/api/v1/jobs/feed?limit=50&cursor=${encodeURIComponent(cursor)}`
      : '/api/v1/jobs/feed?limit=50';
    const feedRes = await request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.meta.pagination).toBeDefined();
    ids.push(
      ...(feedRes.body.data.items as { id: string }[]).map((job) => job.id),
    );
    const next = feedRes.body.meta.pagination?.nextCursor as
      | string
      | null
      | undefined;
    if (!next || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    cursor = next;
  }
  return ids;
}
