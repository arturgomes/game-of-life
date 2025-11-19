import { createContext, type ReactNode, useContext } from 'react';

/**
 * Layout context for managing layout-specific state
 * Future extensibility: sidebar state, theme, responsive breakpoints
 */

type LayoutContextValue = {
  // Future: theme, sidebar state, etc.
  version: string;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within Layout');
  }
  return context;
}

type LayoutProviderProps = {
  children: ReactNode;
};

export function LayoutProvider({ children }: LayoutProviderProps) {
  const value: LayoutContextValue = {
    version: '1.0.0',
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
