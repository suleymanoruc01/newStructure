import type { AuthContext, UserRole } from '@parton/api-contracts';

import { getActiveContext } from './session-memory';

export function pickDefaultActiveContext(
  contexts: AuthContext[],
): AuthContext | null {
  if (contexts.length === 0) {
    return null;
  }
  const worker = contexts.find((c) => c.role === 'worker');
  return worker ?? contexts[0];
}

export function resolveShellRole(contexts: AuthContext[]): UserRole | null {
  const current = getActiveContext();
  if (current) {
    return current.role;
  }
  return pickDefaultActiveContext(contexts)?.role ?? null;
}
