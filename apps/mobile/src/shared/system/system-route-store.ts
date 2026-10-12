import { useSyncExternalStore } from 'react';

export type SystemRoute =
  | 'forbidden'
  | 'session-expired'
  | 'restriction'
  | 'blocking'
  | null;

let route: SystemRoute = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getSystemRoute(): SystemRoute {
  return route;
}

export function openSystemRoute(next: Exclude<SystemRoute, null>) {
  route = next;
  emit();
}

export function clearSystemRoute() {
  route = null;
  emit();
}

export function useSystemRoute(): SystemRoute {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    getSystemRoute,
    getSystemRoute,
  );
}
