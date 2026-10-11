import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../i18n';
import { AuthProvider } from '../shared/auth/AuthProvider';
import { PlatformGate } from '../shared/platform/PlatformGate';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <PlatformGate>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PlatformGate>
    </GestureHandlerRootView>
  );
}
