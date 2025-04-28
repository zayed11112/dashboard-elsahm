import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { createCustomTheme } from '../theme';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

type ThemeContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  locale: 'ar',
  setLocale: () => {},
});

// Hook for easy context use
export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [locale, setLocale] = useState<string>('ar');

  // Create theme - always use light mode
  const theme = createCustomTheme('light');

  return (
    <ThemeContext.Provider value={{ locale, setLocale }}>
      <CacheProvider value={cacheRtl}>
        <MuiThemeProvider theme={theme}>
          {children}
        </MuiThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
};