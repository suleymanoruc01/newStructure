let accessToken: string | null = null;
let accessExpiresAt: string | null = null;

export function setAccessSession(tokens: {
  accessToken: string;
  accessExpiresAt?: string;
}): void {
  accessToken = tokens.accessToken;
  accessExpiresAt = tokens.accessExpiresAt ?? null;
}

export function clearAccessSession(): void {
  accessToken = null;
  accessExpiresAt = null;
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    return null;
  }
  if (accessExpiresAt) {
    const expires = Date.parse(accessExpiresAt);
    if (!Number.isNaN(expires) && Date.now() >= expires) {
      accessToken = null;
      accessExpiresAt = null;
      return null;
    }
  }
  return accessToken;
}

export function hasAccessSession(): boolean {
  return getAccessToken() !== null;
}
