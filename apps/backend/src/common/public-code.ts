import { randomBytes } from 'node:crypto';

export const PUBLIC_CODE_PREFIX = {
  employer: 'ER',
  worker: 'EE',
  workplace: 'TR',
  branch: 'BR',
} as const;

export type PublicCodePrefix =
  (typeof PUBLIC_CODE_PREFIX)[keyof typeof PUBLIC_CODE_PREFIX];

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TAIL_LEN = 6;

export function newPublicCode(prefix: PublicCodePrefix): string {
  const bytes = randomBytes(TAIL_LEN);
  let tail = '';
  for (let i = 0; i < TAIL_LEN; i += 1) {
    tail += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${prefix}${tail}`;
}

export function isPublicCode(
  value: string,
  prefix?: PublicCodePrefix,
): boolean {
  if (!/^(ER|EE|TR|BR)[A-Za-z0-9]{6}$/.test(value)) {
    return false;
  }
  return prefix ? value.startsWith(prefix) : true;
}

type CodeStore = {
  user: { findUnique: (args: { where: { employerPublicCode: string } }) => Promise<unknown> };
  workerProfile: { findUnique: (args: { where: { publicCode: string } }) => Promise<unknown> };
  employer: { findUnique: (args: { where: { publicCode: string } }) => Promise<unknown> };
  branch: { findUnique: (args: { where: { publicCode: string } }) => Promise<unknown> };
};

export async function allocatePublicCode(
  db: CodeStore,
  prefix: PublicCodePrefix,
): Promise<string> {
  for (let i = 0; i < 12; i += 1) {
    const code = newPublicCode(prefix);
    let taken: unknown;
    switch (prefix) {
      case 'ER':
        taken = await db.user.findUnique({
          where: { employerPublicCode: code },
        });
        break;
      case 'EE':
        taken = await db.workerProfile.findUnique({
          where: { publicCode: code },
        });
        break;
      case 'TR':
        taken = await db.employer.findUnique({ where: { publicCode: code } });
        break;
      case 'BR':
        taken = await db.branch.findUnique({ where: { publicCode: code } });
        break;
      default: {
        const _never: never = prefix;
        throw new Error(`Unknown prefix ${_never}`);
      }
    }
    if (!taken) {
      return code;
    }
  }
  throw new Error('Benzersiz genel kod üretilemedi.');
}
