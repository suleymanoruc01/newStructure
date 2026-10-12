import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdminEmployerSubscriptionPatchBody,
  AdminSubscriptionPlanPatchBody,
} from '@parton/api-contracts';
import { ErrorCode, employerSubscriptionPlanCodeSchema } from '@parton/api-contracts';
import type { z } from 'zod';

type EmployerSubscriptionPlanCode = z.infer<
  typeof employerSubscriptionPlanCodeSchema
>;

import { ApiException } from '../common/api.exception.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LegalAuditLogger,
  ) {}

  private mapPlan(row: {
    id: string;
    planCode: string;
    displayName: string;
    monthlyPriceTry: number;
    yearlyPriceTry: number;
    maxBranches: number;
    maxMemberships: number;
    tokenBonusOnPurchase: number;
    prioritySupport: boolean;
    analyticsAccess: boolean;
    apiAccess: boolean;
    isActive: boolean;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      planCode: row.planCode as EmployerSubscriptionPlanCode,
      displayName: row.displayName,
      monthlyPriceTry: row.monthlyPriceTry,
      yearlyPriceTry: row.yearlyPriceTry,
      maxBranches: row.maxBranches,
      maxMemberships: row.maxMemberships,
      tokenBonusOnPurchase: row.tokenBonusOnPurchase,
      prioritySupport: row.prioritySupport,
      analyticsAccess: row.analyticsAccess,
      apiAccess: row.apiAccess,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listPlans() {
    const rows = await this.prisma.employerSubscriptionPlan.findMany({
      orderBy: { monthlyPriceTry: 'asc' },
    });
    return { items: rows.map((row) => this.mapPlan(row)) };
  }

  async patchPlan(
    planId: string,
    body: AdminSubscriptionPlanPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const existing = await this.prisma.employerSubscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!existing) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Abonelik planı bulunamadı.',
      );
    }
    const updated = await this.prisma.employerSubscriptionPlan.update({
      where: { id: planId },
      data: body,
    });
    await this.audit.append({
      category: 'admin',
      action: 'subscription_plan_updated',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer_subscription_plan',
      resourceId: planId,
      requestId,
      metadata: { planCode: updated.planCode, patch: body },
    });
    return this.mapPlan(updated);
  }

  async patchEmployerSubscription(
    employerId: string,
    body: AdminEmployerSubscriptionPatchBody,
    actorUserId: string,
    requestId: string,
  ) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const plan = await this.prisma.employerSubscriptionPlan.findFirst({
      where: { planCode: body.planCode, isActive: true },
    });
    if (!plan) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Abonelik planı bulunamadı.',
      );
    }
    const updated = await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        subscriptionPlanCode: body.planCode,
        subscriptionStatus: body.status ?? employer.subscriptionStatus,
        subscriptionEndsAt:
          body.subscriptionEndsAt === undefined
            ? employer.subscriptionEndsAt
            : body.subscriptionEndsAt
              ? new Date(body.subscriptionEndsAt)
              : null,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'employer_subscription_changed',
      actorUserId,
      actorRole: 'admin',
      resourceType: 'employer',
      resourceId: employerId,
      requestId,
      metadata: {
        previousPlanCode: employer.subscriptionPlanCode,
        planCode: body.planCode,
        status: updated.subscriptionStatus,
      },
    });
    return updated;
  }

  async planForEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      select: { subscriptionPlanCode: true },
    });
    if (!employer) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'İşveren bulunamadı.',
      );
    }
    const plan = await this.prisma.employerSubscriptionPlan.findFirst({
      where: { planCode: employer.subscriptionPlanCode },
    });
    if (plan) {
      return plan;
    }
    const fallback = await this.prisma.employerSubscriptionPlan.findFirst({
      where: { planCode: 'free' },
    });
    if (!fallback) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Abonelik planları yapılandırılmamış.',
      );
    }
    return fallback;
  }

  async assertCanAddBranch(employerId: string): Promise<void> {
    const plan = await this.planForEmployer(employerId);
    const count = await this.prisma.branch.count({
      where: { employerId, status: { not: 'archived' } },
    });
    if (count >= plan.maxBranches) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.SUBSCRIPTION_LIMIT_REACHED,
        'Abonelik planı şube limitine ulaşıldı.',
      );
    }
  }

  async userHasPrioritySupport(userId: string): Promise<boolean> {
    const memberships = await this.prisma.employerMembership.findMany({
      where: { userId, status: 'active' },
      include: { employer: { select: { subscriptionPlanCode: true } } },
    });
    if (memberships.length === 0) {
      return false;
    }
    const codes = memberships.map((m) => m.employer.subscriptionPlanCode);
    const plans = await this.prisma.employerSubscriptionPlan.findMany({
      where: { planCode: { in: codes } },
    });
    return plans.some((p) => p.prioritySupport);
  }
}
