import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { LayoutProvider } from './LayoutContext';
import { Main } from './Main';

/**
 * Layout compound component using context pattern
 * Provides consistent structure across the app with future extensibility
 */

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <LayoutProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">{children}</div>
    </LayoutProvider>
  );
}

// Compound pattern exports
Layout.Header = Header;
Layout.Main = Main;
Layout.Footer = Footer;
