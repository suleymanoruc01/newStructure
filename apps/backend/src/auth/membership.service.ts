import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  ManagerPermission,
  MeUser,
  UserRole,
} from '@parton/api-contracts';
import { ErrorCode, MANAGER_PERMISSIONS } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';

import { parseManagerPermissions } from './manager-permissions.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionService } from './session.service.js';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async listRolesForUser(userId: string): Promise<UserRole[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        employerMemberships: { where: { status: 'active' } },
        branchManagers: { where: { status: 'active' } },
        workplaceManagers: { where: { status: 'active' } },
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
    if (user.branchManagers.length > 0 || user.workplaceManagers.length > 0) {
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
        employerMemberships: {
          where: { status: 'active' },
          include: { employer: { select: { legalName: true, tradingName: true } } },
        },
        branchManagers: {
          where: { status: 'active' },
          include: { branch: { include: { employer: { select: { legalName: true, tradingName: true } } } } },
        },
        workplaceManagers: {
          where: { status: 'active' },
          include: { employer: { select: { legalName: true, tradingName: true } } },
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
        label: membership.employer.tradingName ?? membership.employer.legalName,
      });
    }
    const workplaceManagerIds = new Set(
      user.workplaceManagers.map((row) => row.employerId),
    );
    for (const mgr of user.workplaceManagers) {
      contexts.push({
        role: 'manager',
        employerId: mgr.employerId,
        branchIds: [],
        label: mgr.employer.tradingName ?? mgr.employer.legalName,
        permissions: parseManagerPermissions(mgr.permissions),
      });
    }
    const managerByEmployer = new Map<
      string,
      { branchIds: string[]; label?: string; permissions: Set<ManagerPermission> }
    >();
    for (const mgr of user.branchManagers) {
      if (workplaceManagerIds.has(mgr.branch.employerId)) {
        continue;
      }
      const employerId = mgr.branch.employerId;
      const current = managerByEmployer.get(employerId) ?? {
        branchIds: [],
        label: mgr.branch.employer.tradingName ?? mgr.branch.employer.legalName,
        permissions: new Set<ManagerPermission>(),
      };
      current.branchIds.push(mgr.branchId);
      for (const perm of parseManagerPermissions(mgr.permissions)) {
        current.permissions.add(perm);
      }
      managerByEmployer.set(employerId, current);
    }
    for (const [employerId, row] of managerByEmployer) {
      contexts.push({
        role: 'manager',
        employerId,
        branchIds: row.branchIds,
        label: row.label,
        permissions: [...row.permissions],
      });
    }
    if (user.platformAdmin) {
      contexts.push({ role: 'admin' });
    }
    return contexts;
  }

  async toMeUser(userId: string, activeContext?: AuthContext): Promise<MeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: { select: { publicCode: true } } },
    });
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
      email: user.email,
      status: user.status as MeUser['status'],
      deletionRequestedAt: user.deletionRequestedAt?.toISOString() ?? null,
      roles,
      employerPublicCode: user.employerPublicCode,
      workerPublicCode: user.workerProfile?.publicCode ?? null,
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

  async assertManagerLive(
    userId: string,
    ctx: AuthContext,
    branchId?: string | null,
  ): Promise<void> {
    if (ctx.role !== 'manager') {
      return;
    }
    if (!ctx.employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Yönetici bağlamı gerekli.',
      );
    }
    if (!ctx.branchIds?.length) {
      const row = await this.prisma.workplaceManager.findFirst({
        where: {
          userId,
          employerId: ctx.employerId,
          status: 'active',
        },
      });
      if (!row) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Yönetici üyeliği yok.',
        );
      }
      if (branchId) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: branchId, employerId: ctx.employerId },
        });
        if (!branch) {
          throw new ApiException(
            HttpStatus.FORBIDDEN,
            ErrorCode.FORBIDDEN,
            'Bu şube için yetkiniz yok.',
          );
        }
      }
      return;
    }
    if (branchId) {
      if (!ctx.branchIds.includes(branchId)) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Bu şube için yetkiniz yok.',
        );
      }
      const row = await this.prisma.branchManager.findFirst({
        where: { userId, branchId, status: 'active' },
      });
      if (!row) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Yönetici üyeliği yok.',
        );
      }
      return;
    }
    const row = await this.prisma.branchManager.findFirst({
      where: {
        userId,
        status: 'active',
        branchId: { in: ctx.branchIds },
      },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Yönetici üyeliği yok.',
      );
    }
  }

  async permissionsFor(
    userId: string,
    ctx: AuthContext,
    branchId?: string | null,
  ): Promise<ManagerPermission[]> {
    if (ctx.role === 'employer' || ctx.role === 'admin') {
      return [...MANAGER_PERMISSIONS];
    }
    if (ctx.role !== 'manager' || !ctx.employerId) {
      return [];
    }
    if (!ctx.branchIds?.length) {
      const row = await this.prisma.workplaceManager.findFirst({
        where: { userId, employerId: ctx.employerId, status: 'active' },
      });
      return parseManagerPermissions(row?.permissions);
    }
    if (branchId && !ctx.branchIds.includes(branchId)) {
      return [];
    }
    const ids = branchId ? [branchId] : ctx.branchIds;
    const rows = await this.prisma.branchManager.findMany({
      where: {
        userId,
        status: 'active',
        branchId: { in: ids },
        branch: { employerId: ctx.employerId },
      },
    });
    const seen = new Set<ManagerPermission>();
    for (const row of rows) {
      for (const perm of parseManagerPermissions(row.permissions)) {
        seen.add(perm);
      }
    }
    return [...seen];
  }

  async assertPermission(
    userId: string,
    ctx: AuthContext,
    permission: ManagerPermission,
    branchId?: string | null,
  ): Promise<void> {
    if (ctx.role === 'employer' || ctx.role === 'admin') {
      return;
    }
    const perms = await this.permissionsFor(userId, ctx, branchId);
    if (!perms.includes(permission)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu işlem için yetkiniz yok.',
      );
    }
  }

  async revokeManagerContext(userId: string, employerId: string) {
    const contexts = await this.listContexts(userId);
    const fallback =
      contexts.find((ctx) => ctx.role === 'worker') ??
      contexts.find((ctx) => ctx.role === 'employer') ??
      contexts.find(
        (ctx) => ctx.role === 'manager' && ctx.employerId !== employerId,
      ) ??
      ({ role: 'manager' } as AuthContext);
    await this.sessions.demoteManagerSessions(userId, employerId, fallback);
  }

  async syncManagerSessionPermissions(
    userId: string,
    employerId: string,
    permissions: ManagerPermission[],
  ) {
    const sessions = await this.prisma.refreshSession.findMany({
      where: { userId, revokedAt: null },
    });
    for (const session of sessions) {
      const ctx = session.activeContext as AuthContext | null;
      if (
        ctx?.role !== 'manager' ||
        ctx.employerId !== employerId
      ) {
        continue;
      }
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          activeContext: { ...ctx, permissions },
        },
      });
    }
  }
}
