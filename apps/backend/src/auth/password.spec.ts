import { hashPassword, passwordIsStrong, verifyPassword } from './password.js';

describe('password', () => {
  it('accepts the password that was hashed and rejects a different one', async () => {
    const stored = await hashPassword('correct-horse');
    expect(await verifyPassword('correct-horse', stored)).toBe(true);
    expect(await verifyPassword('wrong-horse', stored)).toBe(false);
    expect(await verifyPassword('correct-horse', 'not-a-hash')).toBe(false);
  });

  it('T-008 rejects a password without both a letter and a digit', () => {
    expect(passwordIsStrong('12345678')).toBe(false);
    expect(passwordIsStrong('password')).toBe(false);
    expect(passwordIsStrong('PartOn12')).toBe(true);
  });
});
