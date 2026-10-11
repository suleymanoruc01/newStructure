/** Platform-agnostic helpers (no secrets, no Nest/RN imports). */

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
