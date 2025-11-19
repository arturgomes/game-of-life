import type { ReactNode } from 'react';

type MainProps = {
  children: ReactNode;
};

export function Main({ children }: MainProps) {
  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>;
}

type MainContentProps = {
  children: ReactNode;
};

export function MainContent({ children }: MainContentProps) {
  return <div className="bg-white rounded-lg shadow p-6">{children}</div>;
}

type MainGridProps = {
  children: ReactNode;
};

export function MainGrid({ children }: MainGridProps) {
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>;
}

// Compound pattern exports
Main.Content = MainContent;
Main.Grid = MainGrid;
