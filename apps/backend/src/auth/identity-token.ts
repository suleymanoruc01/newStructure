import { createPublicKey, createVerify } from 'node:crypto';

export class IdentityTokenError extends Error {
  constructor(readonly reason: 'invalid' | 'unconfigured') {
    super(reason);
  }
}

type RsaJwk = {
  kty: 'RSA';
  n: string;
  e: string;
  kid?: string;
};

type IdentityClaims = {
  sub: string;
  email?: string;
};

const jwksCache = new Map<string, { at: number; keys: RsaJwk[] }>();

function decodePart(part: string): unknown {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    throw new IdentityTokenError('invalid');
  }
}

function audienceMatches(
  aud: unknown,
  expected: string,
): boolean {
  if (typeof aud === 'string') {
    return aud === expected;
  }
  return Array.isArray(aud) && aud.includes(expected);
}

async function loadJwks(url: string): Promise<RsaJwk[]> {
  const hit = jwksCache.get(url);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) {
    return hit.keys;
  }
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new IdentityTokenError('invalid');
  }
  if (!response.ok) {
    throw new IdentityTokenError('invalid');
  }
  const body = (await response.json()) as { keys?: RsaJwk[] };
  const keys = (body.keys ?? []).filter(
    (key) => key.kty === 'RSA' && key.n && key.e,
  );
  jwksCache.set(url, { at: Date.now(), keys });
  return keys;
}

export async function verifyIdentityToken(
  idToken: string,
  options: {
    issuer: string;
    audience: string | undefined;
    jwksUrl: string;
    testJwk?: RsaJwk;
  },
): Promise<IdentityClaims> {
  if (!options.audience) {
    throw new IdentityTokenError('unconfigured');
  }
  const parts = idToken.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new IdentityTokenError('invalid');
  }
  const header = decodePart(parts[0]) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256') {
    throw new IdentityTokenError('invalid');
  }
  const payload = decodePart(parts[1]) as {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    sub?: string;
    email?: string;
  };
  const now = Math.floor(Date.now() / 1000);
  if (
    payload.iss !== options.issuer ||
    !audienceMatches(payload.aud, options.audience) ||
    typeof payload.exp !== 'number' ||
    payload.exp <= now ||
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0
  ) {
    throw new IdentityTokenError('invalid');
  }
  const keys = options.testJwk
    ? [options.testJwk]
    : await loadJwks(options.jwksUrl);
  const jwk =
    keys.find((key) => key.kid === header.kid) ??
    (keys.length === 1 ? keys[0] : undefined);
  if (!jwk) {
    throw new IdentityTokenError('invalid');
  }
  const key = createPublicKey({ key: jwk, format: 'jwk' });
  const signature = Buffer.from(parts[2], 'base64url');
  const valid = createVerify('RSA-SHA256')
    .update(`${parts[0]}.${parts[1]}`)
    .verify(key, signature);
  if (!valid) {
    throw new IdentityTokenError('invalid');
  }
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}
