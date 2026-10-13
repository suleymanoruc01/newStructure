import type { ManagerPermission } from '@parton/api-contracts';

import { getActiveContext } from './session-memory';

export function hasManagerPermission(permission: ManagerPermission): boolean {
  const ctx = getActiveContext();
  if (!ctx) {
    return false;
  }
  if (ctx.role === 'employer' || ctx.role === 'admin') {
    return true;
  }
  if (ctx.role !== 'manager') {
    return false;
  }
  return (ctx.permissions ?? []).includes(permission);
}
