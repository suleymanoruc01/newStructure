import { createSign, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { IdentityTokenError, verifyIdentityToken } from './identity-token.js';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: 'jwk' }) as {
  kty: 'RSA';
  n: string;
  e: string;
  kid?: string;
};
jwk.kid = 'test';

function sign(payload: Record<string, unknown>, alg = 'RS256'): string {
  const header = Buffer.from(JSON.stringify({ alg, kid: 'test' })).toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${body}`)
    .sign(privateKey)
    .toString('base64url');
  return `${header}.${body}.${signature}`;
}

const base = {
  iss: 'https://appleid.apple.com',
  aud: 'test-apple',
  sub: 'apple-sub',
  exp: Math.floor(Date.now() / 1000) + 600,
};

describe('verifyIdentityToken', () => {
  it('accepts a signed token and rejects a bad signature', async () => {
    const claims = await verifyIdentityToken(sign(base), {
      issuer: base.iss,
      audience: 'test-apple',
      jwksUrl: 'https://example.invalid/keys',
      testJwk: jwk,
    });
    expect(claims.sub).toBe('apple-sub');

    const [h, b, s] = sign(base).split('.');
    const tampered = `${h}.${b}.${s!.slice(0, -2)}aa`;
    await expect(
      verifyIdentityToken(tampered, {
        issuer: base.iss,
        audience: 'test-apple',
        jwksUrl: 'https://example.invalid/keys',
        testJwk: jwk,
      }),
    ).rejects.toMatchObject({ reason: 'invalid' });
  });

  it('rejects a missing audience as unconfigured', async () => {
    await expect(
      verifyIdentityToken(sign(base), {
        issuer: base.iss,
        audience: undefined,
        jwksUrl: 'https://example.invalid/keys',
        testJwk: jwk,
      }),
    ).rejects.toBeInstanceOf(IdentityTokenError);
  });
});
