import type { AuthContext, MeUser } from '@parton/api-contracts';

let accessToken: string | null = null;
let user: MeUser | null = null;
let contexts: AuthContext[] = [];
let activeContext: AuthContext | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getSessionUser(): MeUser | null {
  return user;
}

export function setSessionUser(next: MeUser | null): void {
  user = next;
}

export function getSessionContexts(): AuthContext[] {
  return contexts;
}

export function setSessionContexts(next: AuthContext[]): void {
  contexts = next;
}

export function getActiveContext(): AuthContext | null {
  return activeContext;
}

export function setActiveContext(next: AuthContext | null): void {
  activeContext = next;
}

export function clearSessionMemory(): void {
  accessToken = null;
  user = null;
  contexts = [];
  activeContext = null;
}
