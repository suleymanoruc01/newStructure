import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type Tx = Prisma.TransactionClient;

export async function resolveEmployerAudience(
  prisma: PrismaService | Tx,
  employerId: string,
  branchId: string,
): Promise<string[]> {
  const memberships = await prisma.employerMembership.findMany({
    where: { employerId, status: 'active' },
    select: { userId: true },
  });
  const managers = await prisma.branchManager.findMany({
    where: { branchId, status: 'active' },
    select: { userId: true },
  });
  const ids = new Set<string>();
  for (const m of memberships) {
    ids.add(m.userId);
  }
  for (const m of managers) {
    ids.add(m.userId);
  }
  return [...ids];
}
