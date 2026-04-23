import { default as React } from 'react';
import { LayoutConfigContextValue } from '../types/types';
interface LayoutConfigProviderProps {
    children: React.ReactNode;
    showHeader?: boolean;
    chatPlaceholder?: string;
    supportPrompts?: string[];
}
export declare const LayoutConfigProvider: React.FC<LayoutConfigProviderProps>;
export declare const useLayoutConfig: () => LayoutConfigContextValue;
export {};
