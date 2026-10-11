import type { AuthContext, MeUser, UserRole } from '@parton/api-contracts';

import { fetchEmployerSetupStatus } from '../../api/employers-api';
import { listPolicies } from '../../api/auth-api';
import { fetchWorkerSetupStatus } from '../../api/workers-api';
import type { AuthPhase, OnboardingKind } from './auth-types';
import { pickDefaultActiveContext } from './active-context';
import { getActiveContext } from './session-memory';

export function primaryRole(
  user: MeUser,
  contexts: AuthContext[],
): UserRole | null {
  const active = getActiveContext();
  if (active) {
    return active.role;
  }
  if (user.roles.length > 0) {
    return user.roles[0];
  }
  return pickDefaultActiveContext(contexts)?.role ?? null;
}

export type EmployerOnboardingStep = 'business' | 'branch';

export async function resolveAuthPhase(
  accessToken: string,
  user: MeUser,
  contexts: AuthContext[],
): Promise<{
  phase: AuthPhase;
  onboardingKind: OnboardingKind | null;
  employerStep: EmployerOnboardingStep | null;
}> {
  const policies = await listPolicies(accessToken);
  if (policies.items.length > 0) {
    return {
      phase: 'needs_policies',
      onboardingKind: null,
      employerStep: null,
    };
  }

  const role = primaryRole(user, contexts);
  if (role === 'worker') {
    const status = await fetchWorkerSetupStatus(accessToken);
    if (!status.complete) {
      return {
        phase: 'needs_onboarding',
        onboardingKind: 'worker',
        employerStep: null,
      };
    }
  } else if (role === 'manager') {
    const hasBranch = contexts.some(
      (c) => c.role === 'manager' && (c.branchIds?.length ?? 0) > 0,
    );
    if (!hasBranch) {
      return {
        phase: 'needs_onboarding',
        onboardingKind: 'manager',
        employerStep: null,
      };
    }
  } else if (role === 'employer') {
    const status = await fetchEmployerSetupStatus(accessToken);
    if (!status.complete) {
      const employerStep: EmployerOnboardingStep =
        status.missing.includes('employer') ? 'business' : 'branch';
      return {
        phase: 'needs_onboarding',
        onboardingKind: 'employer',
        employerStep,
      };
    }
  }

  return {
    phase: 'authenticated',
    onboardingKind: null,
    employerStep: null,
  };
}
