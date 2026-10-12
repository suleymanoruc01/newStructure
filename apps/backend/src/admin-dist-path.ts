import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/** `apps/admin/dist` — stable when `cwd` is not `apps/backend`. */
export function resolveAdminDist(): string {
  return join(moduleDir, '../../admin/dist');
}

export function adminDistIndexExists(): boolean {
  return existsSync(join(resolveAdminDist(), 'index.html'));
}
