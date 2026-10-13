import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import { AuthOtpScreen } from '../../features/auth/screens/AuthOtpScreen';
import { AuthPasswordScreen } from '../../features/auth/screens/AuthPasswordScreen';
import { AuthPhoneScreen } from '../../features/auth/screens/AuthPhoneScreen';
import { AuthPoliciesScreen } from '../../features/auth/screens/AuthPoliciesScreen';
import { AuthRoleSelectScreen } from '../../features/auth/screens/AuthRoleSelectScreen';
import {
  AuthTutorialScreen,
  hasSeenTutorial,
} from '../../features/auth/screens/AuthTutorialScreen';
import { WorkerOnboardingProfileScreen } from '../../features/onboarding/screens/WorkerOnboardingProfileScreen';
import { EmployerOnboardingBusinessScreen } from '../../features/onboarding/screens/EmployerOnboardingBusinessScreen';
import { EmployerOnboardingBranchScreen } from '../../features/onboarding/screens/EmployerOnboardingBranchScreen';
import { ManagerOnboardingJoinScreen } from '../../features/onboarding/screens/ManagerOnboardingJoinScreen';
import { useAuth } from '../../shared/auth/AuthProvider';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  const { phase, onboardingKind } = useAuth();
  const [initialRoute, setInitialRoute] =
    useState<keyof AuthStackParamList>('AuthPhone');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await hasSeenTutorial();
      if (!cancelled) {
        setInitialRoute(seen ? 'AuthPhone' : 'AuthTutorial');
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  const startRoute: keyof AuthStackParamList =
    phase === 'needs_role'
      ? 'AuthRoleSelect'
      : phase === 'needs_policies'
        ? 'AuthPolicies'
        : phase === 'needs_onboarding' && onboardingKind === 'worker'
          ? 'WorkerOnboardingProfile'
          : phase === 'needs_onboarding' && onboardingKind === 'manager'
          ? 'ManagerOnboardingJoin'
          : phase === 'needs_onboarding' && onboardingKind === 'employer'
            ? 'EmployerOnboardingBusiness'
            : initialRoute;

  return (
    <Stack.Navigator
      key={startRoute}
      initialRouteName={startRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AuthTutorial" component={AuthTutorialScreen} />
      <Stack.Screen name="AuthPhone" component={AuthPhoneScreen} />
      <Stack.Screen name="AuthOtp" component={AuthOtpScreen} />
      <Stack.Screen name="AuthPassword" component={AuthPasswordScreen} />
      <Stack.Screen name="AuthRoleSelect" component={AuthRoleSelectScreen} />
      <Stack.Screen name="AuthPolicies" component={AuthPoliciesScreen} />
      <Stack.Screen
        name="WorkerOnboardingProfile"
        component={WorkerOnboardingProfileScreen}
      />
      <Stack.Screen
        name="EmployerOnboardingBusiness"
        component={EmployerOnboardingBusinessScreen}
      />
      <Stack.Screen
        name="EmployerOnboardingBranch"
        component={EmployerOnboardingBranchScreen}
      />
      <Stack.Screen
        name="ManagerOnboardingJoin"
        component={ManagerOnboardingJoinScreen}
      />
    </Stack.Navigator>
  );
}
