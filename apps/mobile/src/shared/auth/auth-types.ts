export type AuthPhase =
  | 'booting'
  | 'unauthenticated'
  | 'authenticated'
  | 'needs_role'
  | 'needs_policies'
  | 'needs_onboarding';

export type OnboardingKind = 'worker' | 'employer' | 'manager';
