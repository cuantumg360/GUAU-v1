import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorScheme } from '@/design/tokens';

type Theme = {
  colors: ColorScheme;
  isDark: boolean;
};

const ThemeContext = createContext<Theme>({ colors: lightColors, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
