import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function hashOtp(code: string, pepper: string): string {
  return createHmac('sha256', pepper).update(code).digest('hex');
}

export function verifyOtpHash(
  code: string,
  pepper: string,
  expectedHash: string,
): boolean {
  const actual = hashOtp(code, pepper);
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(expectedHash, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function hashRefreshToken(token: string, pepper: string): string {
  return createHash('sha256').update(`${token}:${pepper}`).digest('hex');
}

export function hashDeviceId(deviceId: string, pepper: string): string {
  return createHash('sha256').update(`device:${pepper}:${deviceId}`).digest('hex');
}

export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function newCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

export function generateOtpCode(): string {
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, '0');
}

const MANAGER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateManagerJoinCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += MANAGER_CODE_ALPHABET[bytes[i] % MANAGER_CODE_ALPHABET.length];
  }
  return code;
}

export function hashManagerJoinCode(code: string, pepper: string): string {
  const normalized = code.trim().toUpperCase();
  return createHmac('sha256', pepper)
    .update(`manager-join:${normalized}`)
    .digest('hex');
}

export function verifyManagerJoinCode(
  code: string,
  pepper: string,
  expectedHash: string,
): boolean {
  const actual = hashManagerJoinCode(code, pepper);
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(expectedHash, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
