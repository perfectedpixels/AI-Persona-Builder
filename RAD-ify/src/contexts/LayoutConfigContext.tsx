import React, { createContext, useContext, useState, useCallback } from 'react';
import type { LayoutConfigContextValue } from '../types/types';

const LayoutConfigContext = createContext<LayoutConfigContextValue | undefined>(undefined);

interface LayoutConfigProviderProps {
  children: React.ReactNode;
  showHeader?: boolean;
  chatPlaceholder?: string;
  supportPrompts?: string[];
}

export const LayoutConfigProvider: React.FC<LayoutConfigProviderProps> = ({
  children,
  showHeader: initialShowHeader = true,
  chatPlaceholder: initialChatPlaceholder = 'Ask anything...',
  supportPrompts: initialSupportPrompts = [],
}) => {
  const [showHeader, setShowHeaderState] = useState(initialShowHeader);
  const [chatPlaceholder, setChatPlaceholderState] = useState(initialChatPlaceholder);
  const [supportPrompts, setSupportPromptsState] = useState<string[]>(initialSupportPrompts);
  const [onSupportPromptClick, setOnSupportPromptClickState] = useState<
    ((prompt: string) => void) | null
  >(null);

  const setShowHeader = useCallback((v: boolean) => setShowHeaderState(v), []);
  const setChatPlaceholder = useCallback((v: string) => setChatPlaceholderState(v), []);
  const setSupportPrompts = useCallback((v: string[]) => setSupportPromptsState(v), []);
  const setOnSupportPromptClick = useCallback(
    (fn: ((prompt: string) => void) | null) => {
      setOnSupportPromptClickState(() => fn);
    },
    [],
  );

  return (
    <LayoutConfigContext.Provider
      value={{
        showHeader,
        chatPlaceholder,
        supportPrompts,
        onSupportPromptClick,
        setShowHeader,
        setChatPlaceholder,
        setSupportPrompts,
        setOnSupportPromptClick,
      }}
    >
      {children}
    </LayoutConfigContext.Provider>
  );
};

export const useLayoutConfig = (): LayoutConfigContextValue => {
  const context = useContext(LayoutConfigContext);
  if (context === undefined) {
    throw new Error('useLayoutConfig must be used within a LayoutConfigProvider');
  }
  return context;
};
