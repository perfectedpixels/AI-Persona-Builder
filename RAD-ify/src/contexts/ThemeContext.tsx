import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeMode, ThemePreference, ThemeContextValue } from '../types/types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function resolveMode(preference: ThemePreference): ThemeMode {
  return preference === 'system' ? getSystemTheme() : preference;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultPreference?: ThemePreference;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  storageKey = 'rad-theme-preference',
  defaultPreference = 'system',
}) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(storageKey) as ThemePreference | null;
      return saved && ['light', 'dark', 'system'].includes(saved) ? saved : defaultPreference;
    } catch {
      return defaultPreference;
    }
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey) as ThemePreference | null;
      const pref = saved && ['light', 'dark', 'system'].includes(saved) ? saved : defaultPreference;
      return resolveMode(pref);
    } catch {
      return resolveMode(defaultPreference);
    }
  });

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.body.classList.remove('awsui-light-mode', 'awsui-dark-mode');
    document.body.classList.add(`awsui-${mode}-mode`);
  }, [mode]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (preference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(storageKey, pref);
    } catch {
      // localStorage unavailable — silently ignore
    }
    setMode(resolveMode(pref));
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light';
    setPreference(next);
  }, [mode, setPreference]);

  return (
    <ThemeContext.Provider value={{ mode, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
