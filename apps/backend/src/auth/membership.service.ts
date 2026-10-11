import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthContext, MeUser, UserRole } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async listRolesForUser(userId: string): Promise<UserRole[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        employerMemberships: { where: { status: 'active' } },
        branchManagers: { where: { status: 'active' } },
        platformAdmin: true,
      },
    });
    if (!user) {
      return [];
    }
    const roles = new Set<UserRole>();
    if (user.workerProfile) {
      roles.add('worker');
    }
    if (user.employerMemberships.length > 0) {
      roles.add('employer');
    }
    if (user.branchManagers.length > 0) {
      roles.add('manager');
    }
    if (user.platformAdmin) {
      roles.add('admin');
    }
    return [...roles];
  }

  async listContexts(userId: string): Promise<AuthContext[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        employerMemberships: { where: { status: 'active' } },
        branchManagers: {
          where: { status: 'active' },
          include: { branch: true },
        },
        platformAdmin: true,
      },
    });
    if (!user) {
      return [];
    }
    const contexts: AuthContext[] = [];
    if (user.workerProfile) {
      contexts.push({ role: 'worker' });
    }
    for (const membership of user.employerMemberships) {
      contexts.push({
        role: 'employer',
        employerId: membership.employerId,
      });
    }
    const managerByEmployer = new Map<string, string[]>();
    for (const mgr of user.branchManagers) {
      const employerId = mgr.branch.employerId;
      const list = managerByEmployer.get(employerId) ?? [];
      list.push(mgr.branchId);
      managerByEmployer.set(employerId, list);
    }
    for (const [employerId, branchIds] of managerByEmployer) {
      contexts.push({
        role: 'manager',
        employerId,
        branchIds,
      });
    }
    if (user.platformAdmin) {
      contexts.push({ role: 'admin' });
    }
    return contexts;
  }

  async toMeUser(userId: string, activeContext?: AuthContext): Promise<MeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User missing');
    }
    const roles = await this.listRolesForUser(userId);
    if (
      activeContext?.role &&
      !roles.includes(activeContext.role as UserRole)
    ) {
      roles.push(activeContext.role as UserRole);
    }
    return {
      id: user.id,
      phone: user.phoneE164,
      locale: user.locale,
      roles,
    };
  }

  pickDefaultContext(contexts: AuthContext[]): AuthContext {
    if (contexts.length === 0) {
      return { role: 'worker' };
    }
    const worker = contexts.find((c) => c.role === 'worker');
    return worker ?? contexts[0];
  }

  assertContextAllowed(
    contexts: AuthContext[],
    desired: AuthContext,
  ): AuthContext {
    const match = contexts.find((ctx) => {
      if (ctx.role !== desired.role) {
        return false;
      }
      if (desired.role === 'worker' || desired.role === 'admin') {
        return true;
      }
      if (ctx.employerId !== desired.employerId) {
        return false;
      }
      if (desired.role === 'manager' && desired.branchIds?.length) {
        const allowed = new Set(ctx.branchIds ?? []);
        return desired.branchIds.every((id) => allowed.has(id));
      }
      return true;
    });
    if (!match) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu bağlam kullanılamıyor.',
      );
    }
    return match;
  }
}
