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
  readPolicy,
  assignRole,
  fetchContexts,
  listPolicies,
  fetchIdentityProviders,
  fetchMe,
  loginWithIdentity,
  loginWithPhonePassword,
  setAccountPassword,
  refreshTokens,
  requestOtp,
  switchAuthContext,
  verifyOtp,
} from '../../api/auth-api';
import type { EmployerCreateData } from '../../api/employers-api-types';
import type { ManagerJoinData } from '../../api/manager-api-types';
import { unregisterPushToken } from '../../notifications/push-registration';
import { ApiClientError } from '../../api/client';
import { clearSystemRoute } from '../system/system-route-store';
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
  platformIdentityProvider,
  requestIdentityToken,
} from '../../features/auth/linked-sign-in';
import {
  postLoginRoute,
  resolveAuthPhase,
  type EmployerOnboardingStep,
  type PostLoginRoute,
} from './auth-gate';
import type { AuthPhase, OnboardingKind } from './auth-types';

type AuthContextValue = {
  phase: AuthPhase;
  user: MeUser | null;
  contexts: AuthContext[];
  onboardingKind: OnboardingKind | null;
  employerOnboardingStep: EmployerOnboardingStep | null;
  bootError: string | null;
  requestPhoneOtp: (
    phone: string,
    purpose?: 'register' | 'password_reset',
  ) => Promise<{ challengeId: string }>;
  verifyPhoneOtp: (
    challengeId: string,
    code: string,
    options?: { password?: string; holdPhase?: boolean },
  ) => Promise<MeUser>;
  saveSignupPassword: (password: string) => Promise<MeUser | null>;
  loginWithPassword: (
    phone: string,
    password: string,
  ) => Promise<{ user: MeUser; nextRoute: PostLoginRoute | null }>;
  signInWithLinkedIdentity: () => Promise<MeUser>;
  selectRole: (role: UserRole) => Promise<void>;
  recordPolicyRead: (policyId: string, version: string) => Promise<void>;
  acknowledgePolicy: (
    policyId: string,
    version: string,
  ) => Promise<PolicyRow[]>;
  continueAfterPolicies: (policiesClear?: boolean) => Promise<AuthPhase>;
  loadPendingPolicies: () => Promise<PolicyRow[]>;
  applyEmployerCreate: (data: EmployerCreateData) => void;
  applyManagerJoin: (data: ManagerJoinData) => void;
  completeOnboarding: () => Promise<{
    phase: AuthPhase;
    onboardingKind: OnboardingKind | null;
    employerStep: EmployerOnboardingStep | null;
  }>;
  switchActiveContext: (context: AuthContext) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthReactContext = createContext<AuthContextValue | null>(null);

type PolicyRow = {
  id: string;
  title: string;
  body: string;
  version: string;
  required: boolean;
};

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
      return resolved;
    },
    [applyResolvedPhase],
  );

  const enterSession = useCallback(
    async (accessToken: string, me: MeUser, ctx: AuthContext[]) => {
      if (me.roles.length === 0) {
        setPhase('needs_role');
        return {
          phase: 'needs_role' as const,
          onboardingKind: null,
          employerStep: null,
        };
      }
      return syncGate(accessToken, me, ctx);
    },
    [syncGate],
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
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          (err.code === 'ACCOUNT_RESTRICTED' || err.code === 'ACCOUNT_BANNED')
        ) {
          if (!cancelled) {
            setPhase('authenticated');
          }
          return;
        }
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

  const requestPhoneOtp = useCallback(
    async (phone: string, purpose: 'register' | 'password_reset' = 'register') => {
      const data = await requestOtp({ phone, purpose });
      return { challengeId: data.challengeId };
    },
    [],
  );

  const verifyPhoneOtp = useCallback(
    async (
      challengeId: string,
      code: string,
      options?: { password?: string; holdPhase?: boolean },
    ) => {
      const deviceId = await loadOrCreateDeviceInstallId();
      const data = await verifyOtp({
        challengeId,
        code,
        password: options?.password,
        deviceId,
      });
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
      if (!options?.holdPhase) {
        await enterSession(data.accessToken, data.user, data.contexts ?? []);
      }
      return data.user;
    },
    [applySession, enterSession],
  );

  const saveSignupPassword = useCallback(
    async (password: string) => {
      const access = getAccessToken();
      if (!access) {
        throw new ApiClientError(
          'Oturum yanıtı geçersiz.',
          401,
          'UNAUTHORIZED',
        );
      }
      await setAccountPassword({ password }, access);
      if (!user) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await enterSession(access, user, contexts);
      return user;
    },
    [contexts, enterSession, user],
  );

  const loginWithPassword = useCallback(
    async (phone: string, password: string) => {
      const data = await loginWithPhonePassword({ phone, password });
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
      const gate = await enterSession(
        data.accessToken,
        data.user,
        data.contexts ?? [],
      );
      return { user: data.user, nextRoute: postLoginRoute(gate) };
    },
    [applySession, enterSession],
  );

  const signInWithLinkedIdentity = useCallback(async () => {
    const provider = platformIdentityProvider();
    if (!provider) {
      throw new ApiClientError(
        'Bu giriş yöntemi henüz yapılandırılmadı.',
        503,
        'IDENTITY_NOT_CONFIGURED',
      );
    }
    const setup = await fetchIdentityProviders();
    const clientId =
      provider === 'apple' ? setup.appleClientId : setup.googleClientId;
    if (!clientId) {
      throw new ApiClientError(
        'Bu giriş yöntemi henüz yapılandırılmadı.',
        503,
        'IDENTITY_NOT_CONFIGURED',
      );
    }
    const idToken = await requestIdentityToken(provider, clientId);
    const deviceId = await loadOrCreateDeviceInstallId();
    const data = await loginWithIdentity({ provider, idToken, deviceId });
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
    await enterSession(data.accessToken, data.user, data.contexts ?? []);
    return data.user;
  }, [applySession, enterSession]);

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
      await syncGate(data.accessToken, data.user, data.contexts);
    },
    [applySession, syncGate],
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
      body: p.body,
      version: p.version,
      required: p.required,
    }));
  }, []);

  const refreshPolicyGate = useCallback(
    async (policiesClear = false) => {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const me = user ?? (await fetchMe(token));
      const ctx =
        contexts.length > 0 ? contexts : (await fetchContexts(token)).items;
      setUser(me);
      setContexts(ctx);
      const resolved = await resolveAuthPhase(token, me, ctx, {
        policiesClear,
      });
      applyResolvedPhase(resolved);
      return resolved.phase;
    },
    [applyResolvedPhase, contexts, user],
  );

  const recordPolicyRead = useCallback(async (policyId: string, version: string) => {
    const token = getAccessToken();
    if (!token) {
      throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
    }
    await readPolicy({ policyId, version, reachedEnd: true }, token);
  }, []);

  const acknowledgePolicy = useCallback(
    async (policyId: string, version: string) => {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await acceptPolicies({ policyId, version }, token);
      const pending = await listPolicies(token);
      const rows = pending.items.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        version: p.version,
        required: p.required,
      }));
      if (rows.length === 0) {
        await refreshPolicyGate(true);
      }
      return rows;
    },
    [refreshPolicyGate],
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
    return syncGate(token, me, ctx);
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
    const access = getAccessToken();
    if (access) {
      try {
        await unregisterPushToken(access);
      } catch {
        // Sign-out still clears the local session if the token delete fails.
      }
    }
    await clearRefreshToken();
    clearSessionMemory();
    clearSystemRoute();
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
      saveSignupPassword,
      loginWithPassword,
      signInWithLinkedIdentity,
      selectRole,
      recordPolicyRead,
      acknowledgePolicy,
      continueAfterPolicies: refreshPolicyGate,
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
      saveSignupPassword,
      loginWithPassword,
      signInWithLinkedIdentity,
      selectRole,
      recordPolicyRead,
      acknowledgePolicy,
      refreshPolicyGate,
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
