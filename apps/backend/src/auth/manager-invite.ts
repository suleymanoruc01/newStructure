import {
  generateManagerJoinCode,
  hashManagerJoinCode,
} from './auth.crypto.js';

type InviteDb = {
  workplaceManagerInvite: {
    findFirst: (args: { where: { codeHash: string } }) => Promise<unknown>;
  };
  branchManagerInvite: {
    findFirst: (args: { where: { codeHash: string } }) => Promise<unknown>;
  };
};

export function managerInviteExpiry(now = Date.now()): Date {
  return new Date(now + 365 * 24 * 60 * 60 * 1000);
}

export async function allocateUnusedManagerJoinCode(
  db: InviteDb,
  pepper: string,
): Promise<{ joinCode: string; codeHash: string }> {
  for (let i = 0; i < 12; i += 1) {
    const joinCode = generateManagerJoinCode();
    const codeHash = hashManagerJoinCode(joinCode, pepper);
    const [workplace, branch] = await Promise.all([
      db.workplaceManagerInvite.findFirst({ where: { codeHash } }),
      db.branchManagerInvite.findFirst({ where: { codeHash } }),
    ]);
    if (!workplace && !branch) {
      return { joinCode, codeHash };
    }
  }
  throw new Error('Benzersiz yönetici kodu üretilemedi.');
}
