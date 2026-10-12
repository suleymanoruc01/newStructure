import type { AuthContext, UserRole } from '@parton/api-contracts';

import { getActiveContext } from './session-memory';

export function pickDefaultActiveContext(
  contexts: AuthContext[],
): AuthContext | null {
  if (contexts.length === 0) {
    return null;
  }
  const worker = contexts.find((item) => item.role === 'worker');
  const employer = contexts.find((item) => item.role === 'employer');
  const manager = contexts.find((item) => item.role === 'manager');
  const present = [worker, employer, manager].filter(
    (item): item is AuthContext => item != null,
  );
  if (present.length === 1) {
    return present[0];
  }
  return worker ?? employer ?? manager ?? contexts[0];
}

export function resolveShellRole(contexts: AuthContext[]): UserRole | null {
  const current = getActiveContext();
  const currentMatches =
    current != null &&
    contexts.some(
      (item) =>
        item.role === current.role && item.employerId === current.employerId,
    );
  if (current && currentMatches) {
    return current.role;
  }
  return pickDefaultActiveContext(contexts)?.role ?? null;
}
