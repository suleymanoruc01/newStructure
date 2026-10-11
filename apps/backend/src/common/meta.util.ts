import { randomUUID } from 'node:crypto';

import type { Meta } from '@parton/api-contracts';

export function buildMeta(requestId: string): Meta {
  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function newRequestId(): string {
  return randomUUID();
}
