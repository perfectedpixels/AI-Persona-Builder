import { default as React } from 'react';
import { ThemePreference, ThemeContextValue } from '../types/types';
interface ThemeProviderProps {
    children: React.ReactNode;
    storageKey?: string;
    defaultPreference?: ThemePreference;
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export declare const useTheme: () => ThemeContextValue;
export {};
