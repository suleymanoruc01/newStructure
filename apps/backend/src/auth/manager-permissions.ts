import {
  managerPermissionSchema,
  type ManagerPermission,
} from '@parton/api-contracts';

export function parseManagerPermissions(value: unknown): ManagerPermission[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<ManagerPermission>();
  for (const item of value) {
    const parsed = managerPermissionSchema.safeParse(item);
    if (parsed.success) {
      seen.add(parsed.data);
    }
  }
  return [...seen];
}
