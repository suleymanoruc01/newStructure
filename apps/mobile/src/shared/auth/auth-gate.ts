import type { AuthContext, MeUser, UserRole } from '@parton/api-contracts';

import { fetchEmployerSetupStatus } from '../../api/employers-api';
import { listPolicies } from '../../api/auth-api';
import { fetchWorkerSetupStatus } from '../../api/workers-api';
import type { AuthPhase, OnboardingKind } from './auth-types';
import { resolveShellRole } from './active-context';
import { managerOnboardingComplete } from './manager-onboarding';

export function primaryRole(
  user: MeUser,
  contexts: AuthContext[],
): UserRole | null {
  const shell = resolveShellRole(contexts);
  if (shell === 'worker' || shell === 'employer' || shell === 'manager') {
    return shell;
  }
  return (
    (user.roles ?? []).find(
      (role) => role === 'worker' || role === 'employer' || role === 'manager',
    ) ?? null
  );
}

export type EmployerOnboardingStep = 'business' | 'branch';

export function employerSetupStep(missing: string[]): EmployerOnboardingStep {
  if (missing.includes('employer') || missing.includes('industries')) {
    return 'business';
  }
  return 'branch';
}

export type PostLoginRoute =
  | 'AuthRoleSelect'
  | 'AuthPolicies'
  | 'WorkerOnboardingProfile'
  | 'EmployerOnboardingBusiness'
  | 'EmployerOnboardingBranch'
  | 'ManagerOnboardingJoin';

export function continueAfterGate(
  navigation: { replace: (name: PostLoginRoute) => void },
  gate: {
    phase: AuthPhase;
    onboardingKind: OnboardingKind | null;
    employerStep: EmployerOnboardingStep | null;
  },
) {
  const next = postLoginRoute(gate);
  if (next) {
    navigation.replace(next);
  }
}

export function postLoginRoute(gate: {
  phase: AuthPhase;
  onboardingKind: OnboardingKind | null;
  employerStep: EmployerOnboardingStep | null;
}): PostLoginRoute | null {
  if (gate.phase === 'needs_role') {
    return 'AuthRoleSelect';
  }
  if (gate.phase === 'needs_policies') {
    return 'AuthPolicies';
  }
  if (gate.phase === 'needs_onboarding' && gate.onboardingKind === 'worker') {
    return 'WorkerOnboardingProfile';
  }
  if (gate.phase === 'needs_onboarding' && gate.onboardingKind === 'manager') {
    return 'ManagerOnboardingJoin';
  }
  if (gate.phase === 'needs_onboarding' && gate.onboardingKind === 'employer') {
    return gate.employerStep === 'branch'
      ? 'EmployerOnboardingBranch'
      : 'EmployerOnboardingBusiness';
  }
  return null;
}

export async function resolveAuthPhase(
  accessToken: string,
  user: MeUser,
  contexts: AuthContext[],
  options?: { policiesClear?: boolean },
): Promise<{
  phase: AuthPhase;
  onboardingKind: OnboardingKind | null;
  employerStep: EmployerOnboardingStep | null;
}> {
  if (!options?.policiesClear) {
    const policies = await listPolicies(accessToken);
    if ((policies.items ?? []).length > 0) {
      return {
        phase: 'needs_policies',
        onboardingKind: null,
        employerStep: null,
      };
    }
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
    if (!managerOnboardingComplete(contexts)) {
      return {
        phase: 'needs_onboarding',
        onboardingKind: 'manager',
        employerStep: null,
      };
    }
  } else if (role === 'employer') {
    const status = await fetchEmployerSetupStatus(accessToken);
    if (!status.complete) {
      const employerStep = employerSetupStep(status.missing ?? []);
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
