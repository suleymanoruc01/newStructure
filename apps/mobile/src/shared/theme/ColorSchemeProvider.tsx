import React, { createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';

type Scheme = 'light' | 'dark';

type ColorSchemeValue = {
  scheme: Scheme;
  setScheme: (next: Scheme) => void;
};

const ColorSchemeContext = createContext<ColorSchemeValue>({
  scheme: 'light',
  setScheme: () => undefined,
});

export function useAppColorScheme(): ColorSchemeValue {
  return useContext(ColorSchemeContext);
}

/** Login canvas is the only product theme (cream / forest). */
export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({ scheme: 'light' as const, setScheme: () => undefined }),
    [],
  );
  return (
    <ColorSchemeContext.Provider value={value}>
      <View className="flex-1">{children}</View>
    </ColorSchemeContext.Provider>
  );
}
