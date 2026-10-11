import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RoleContextSwitchScreen } from '../../features/shared/screens/RoleContextSwitchScreen';
import { SharedForbiddenScreen } from '../../features/shared/screens/SharedForbiddenScreen';
import { SharedSessionExpiredScreen } from '../../features/shared/screens/SharedSessionExpiredScreen';
import { useAuth } from '../../shared/auth/AuthProvider';
import { useSystemRoute } from '../../shared/system/system-route-store';
import { resolveShellRole } from '../../shared/auth/active-context';
import { AuthStackNavigator } from './AuthStack';
import { EmployerStackNavigator } from './EmployerStack';
import { WorkerStackNavigator } from './WorkerStack';
import { linking } from './linking';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppShellPlaceholder() {
  const { user, signOut, contexts } = useAuth();
  const [contextSwitchOpen, setContextSwitchOpen] = useState(false);
  const shellRole = resolveShellRole(contexts);
  const showWorker = shellRole === 'worker';
  const showEmployer = shellRole === 'employer' || shellRole === 'manager';

  if (contextSwitchOpen) {
    return (
      <View className="flex-1 bg-surface-base">
        <RoleContextSwitchScreen onClose={() => setContextSwitchOpen(false)} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-base">
      {contexts.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          className="mx-4 mt-2 rounded-full bg-surface-1 px-3 py-2"
          onPress={() => setContextSwitchOpen(true)}
          testID="ActiveContextBadge"
        >
          <Text className="text-center text-sm text-text-high">
            {shellRole ?? '—'}
          </Text>
        </Pressable>
      ) : null}
      {showWorker ? (
        <WorkerStackNavigator />
      ) : showEmployer ? (
        <EmployerStackNavigator />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-semibold text-text-high">PartOn</Text>
          <Text className="mt-2 text-center text-text-medium">
            {user?.phone ?? ''}
          </Text>
        </View>
      )}
      <Text
        accessibilityRole="button"
        className="mb-6 text-center text-base font-semibold text-forest"
        onPress={() => void signOut()}
      >
        Çıkış yap
      </Text>
    </View>
  );
}

function SystemOverlay() {
  const route = useSystemRoute();
  if (route === 'forbidden') {
    return (
      <View className="absolute inset-0 z-50 bg-surface-base">
        <SharedForbiddenScreen />
      </View>
    );
  }
  if (route === 'session-expired') {
    return (
      <View className="absolute inset-0 z-50 bg-surface-base">
        <SharedSessionExpiredScreen />
      </View>
    );
  }
  return null;
}

export function RootNavigator() {
  const { phase } = useAuth();

  const showApp = phase === 'authenticated';

  return (
    <NavigationContainer linking={linking}>
      <View className="flex-1">
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showApp ? (
            <Stack.Screen name="AppShell" component={AppShellPlaceholder} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStackNavigator} />
          )}
        </Stack.Navigator>
        {showApp ? <SystemOverlay /> : null}
      </View>
    </NavigationContainer>
  );
}
