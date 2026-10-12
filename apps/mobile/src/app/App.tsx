import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../i18n';
import { AuthProvider } from '../shared/auth/AuthProvider';
import { PlatformGate } from '../shared/platform/PlatformGate';
import { ColorSchemeProvider } from '../shared/theme/ColorSchemeProvider';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ColorSchemeProvider>
          <PlatformGate>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </PlatformGate>
        </ColorSchemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
