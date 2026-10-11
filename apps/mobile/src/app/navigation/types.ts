import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  AuthTutorial: undefined;
  AuthPhone: undefined;
  AuthOtp: {
    challengeId: string;
    phone: string;
    purpose: 'register' | 'password_reset';
  };
  AuthPassword:
    | { mode: 'login'; phone: string }
    | { mode: 'set'; purpose: 'register' | 'password_reset' };
  AuthRoleSelect: undefined;
  AuthPolicies: undefined;
  WorkerOnboardingProfile: undefined;
  EmployerOnboardingBusiness: undefined;
  EmployerOnboardingBranch: undefined;
  ManagerOnboardingJoin: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  AppShell: undefined;
};
