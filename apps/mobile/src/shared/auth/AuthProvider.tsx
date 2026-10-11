import type { AuthContext, MeUser, UserRole } from '@parton/api-contracts';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  acceptPolicies,
  assignRole,
  fetchContexts,
  listPolicies,
  fetchMe,
  refreshTokens,
  requestOtp,
  switchAuthContext,
  verifyOtp,
} from '../../api/auth-api';
import type { EmployerCreateData } from '../../api/employers-api-types';
import type { ManagerJoinData } from '../../api/manager-api-types';
import { ApiClientError } from '../../api/client';
import {
  clearSessionMemory,
  getAccessToken,
  setAccessToken,
  setActiveContext,
  setSessionContexts,
  setSessionUser,
} from './session-memory';
import { pickDefaultActiveContext } from './active-context';
import {
  clearRefreshToken,
  loadOrCreateDeviceInstallId,
  loadRefreshToken,
  saveRefreshToken,
} from './secure-storage';
import {
  resolveAuthPhase,
  type EmployerOnboardingStep,
} from './auth-gate';
import type { AuthPhase, OnboardingKind } from './auth-types';

type AuthContextValue = {
  phase: AuthPhase;
  user: MeUser | null;
  contexts: AuthContext[];
  onboardingKind: OnboardingKind | null;
  employerOnboardingStep: EmployerOnboardingStep | null;
  bootError: string | null;
  requestPhoneOtp: (phone: string) => Promise<{ challengeId: string }>;
  verifyPhoneOtp: (
    challengeId: string,
    code: string,
  ) => Promise<MeUser>;
  selectRole: (role: UserRole) => Promise<void>;
  acceptAllPolicies: (policyIds: string[]) => Promise<void>;
  loadPendingPolicies: () => Promise<
    { id: string; title: string; required: boolean }[]
  >;
  applyEmployerCreate: (data: EmployerCreateData) => void;
  applyManagerJoin: (data: ManagerJoinData) => void;
  completeOnboarding: () => Promise<void>;
  switchActiveContext: (context: AuthContext) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthReactContext = createContext<AuthContextValue | null>(null);

function deriveRolePhase(user: MeUser | null): AuthPhase {
  if (!user) {
    return 'unauthenticated';
  }
  if (user.roles.length === 0) {
    return 'needs_role';
  }
  return 'needs_policies';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<AuthPhase>('booting');
  const [user, setUser] = useState<MeUser | null>(null);
  const [contexts, setContexts] = useState<AuthContext[]>([]);
  const [onboardingKind, setOnboardingKind] = useState<OnboardingKind | null>(
    null,
  );
  const [employerOnboardingStep, setEmployerOnboardingStep] =
    useState<EmployerOnboardingStep | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const applyResolvedPhase = useCallback(
    (
      resolved: Awaited<ReturnType<typeof resolveAuthPhase>>,
    ) => {
      setOnboardingKind(resolved.onboardingKind);
      setEmployerOnboardingStep(resolved.employerStep);
      setPhase(resolved.phase);
    },
    [],
  );

  const applySession = useCallback(
    (
      nextUser: MeUser,
      nextContexts: AuthContext[],
      access: string,
      refresh: string,
    ) => {
      setAccessToken(access);
      setSessionUser(nextUser);
      setSessionContexts(nextContexts);
      setActiveContext(pickDefaultActiveContext(nextContexts));
      setUser(nextUser);
      setContexts(nextContexts);
      void saveRefreshToken(refresh);
    },
    [],
  );

  const syncGate = useCallback(
    async (accessToken: string, me: MeUser, ctx: AuthContext[]) => {
      const resolved = await resolveAuthPhase(accessToken, me, ctx);
      applyResolvedPhase(resolved);
    },
    [applyResolvedPhase],
  );

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const refresh = await loadRefreshToken();
        if (!refresh) {
          if (!cancelled) {
            setPhase('unauthenticated');
          }
          return;
        }
        const tokens = await refreshTokens({ refreshToken: refresh });
        if (!tokens.accessToken || !tokens.refreshToken) {
          throw new ApiClientError(
            'Oturum yanıtı geçersiz.',
            500,
            'INTERNAL_ERROR',
          );
        }
        setAccessToken(tokens.accessToken);
        await saveRefreshToken(tokens.refreshToken);
        const me = await fetchMe(tokens.accessToken);
        const ctx = await fetchContexts(tokens.accessToken);
        if (!cancelled) {
          setSessionUser(me);
          setSessionContexts(ctx.items);
          setUser(me);
          setContexts(ctx.items);
          await syncGate(tokens.accessToken, me, ctx.items);
        }
      } catch {
        await clearRefreshToken();
        clearSessionMemory();
        if (!cancelled) {
          setBootError(null);
          setPhase('unauthenticated');
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [syncGate]);

  const requestPhoneOtp = useCallback(async (phone: string) => {
    const data = await requestOtp({ phone, purpose: 'login' });
    return { challengeId: data.challengeId };
  }, []);

  const verifyPhoneOtp = useCallback(
    async (challengeId: string, code: string) => {
      const deviceId = await loadOrCreateDeviceInstallId();
      const data = await verifyOtp({ challengeId, code, deviceId });
      if (!data.accessToken || !data.refreshToken) {
        throw new ApiClientError(
          'Oturum yanıtı geçersiz.',
          500,
          'INTERNAL_ERROR',
        );
      }
      applySession(
        data.user,
        data.contexts ?? [],
        data.accessToken,
        data.refreshToken,
      );
      setPhase(deriveRolePhase(data.user));
      return data.user;
    },
    [applySession],
  );

  const selectRole = useCallback(
    async (role: UserRole) => {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await assignRole({ role }, token);
      applySession(
        data.user,
        data.contexts,
        data.accessToken,
        data.refreshToken,
      );
      setPhase('needs_policies');
    },
    [applySession],
  );

  const loadPendingPolicies = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return [];
    }
    const data = await listPolicies(token);
    return data.items.map((p) => ({
      id: p.id,
      title: p.title,
      required: p.required,
    }));
  }, []);

  const acceptAllPolicies = useCallback(
    async (policyIds: string[]) => {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      if (policyIds.length > 0) {
        await acceptPolicies({ policyIds }, token);
      }
      const me = user ?? (await fetchMe(token));
      const ctx =
        contexts.length > 0
          ? contexts
          : (await fetchContexts(token)).items;
      setUser(me);
      setContexts(ctx);
      await syncGate(token, me, ctx);
    },
    [contexts, syncGate, user],
  );

  const applyEmployerCreate = useCallback(
    (data: EmployerCreateData) => {
      applySession(
        data.user,
        [{ role: 'employer', employerId: data.employer.id }],
        data.accessToken,
        data.refreshToken,
      );
      setEmployerOnboardingStep('branch');
    },
    [applySession],
  );

  const applyManagerJoin = useCallback(
    (data: ManagerJoinData) => {
      applySession(
        data.user,
        [
          {
            role: 'manager',
            employerId: data.branch.employerId,
            branchIds: [data.branch.id],
          },
        ],
        data.accessToken,
        data.refreshToken,
      );
    },
    [applySession],
  );

  const completeOnboarding = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
    }
    const me = await fetchMe(token);
    const ctx =
      contexts.length > 0
        ? contexts
        : (await fetchContexts(token)).items;
    setUser(me);
    setContexts(ctx);
    setSessionUser(me);
    setSessionContexts(ctx);
    await syncGate(token, me, ctx);
  }, [contexts, syncGate]);

  const switchActiveContextHandler = useCallback(
    async (context: AuthContext) => {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await switchAuthContext(context, token);
      setAccessToken(data.accessToken);
      setSessionUser(data.user);
      setSessionContexts(data.contexts);
      setActiveContext(context);
      setUser(data.user);
      setContexts(data.contexts);
      await syncGate(data.accessToken, data.user, data.contexts);
    },
    [syncGate],
  );

  const signOut = useCallback(async () => {
    await clearRefreshToken();
    clearSessionMemory();
    setUser(null);
    setContexts([]);
    setOnboardingKind(null);
    setEmployerOnboardingStep(null);
    setPhase('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      phase,
      user,
      contexts,
      onboardingKind,
      employerOnboardingStep,
      bootError,
      requestPhoneOtp,
      verifyPhoneOtp,
      selectRole,
      acceptAllPolicies,
      loadPendingPolicies,
      applyEmployerCreate,
      applyManagerJoin,
      completeOnboarding,
      switchActiveContext: switchActiveContextHandler,
      signOut,
    }),
    [
      phase,
      user,
      contexts,
      onboardingKind,
      employerOnboardingStep,
      bootError,
      requestPhoneOtp,
      verifyPhoneOtp,
      selectRole,
      acceptAllPolicies,
      loadPendingPolicies,
      applyEmployerCreate,
      applyManagerJoin,
      completeOnboarding,
      switchActiveContextHandler,
      signOut,
    ],
  );

  return (
    <AuthReactContext.Provider value={value}>
      {children}
    </AuthReactContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthReactContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export type { AuthPhase } from './auth-types';
