import type { ReactNode } from 'react';

type MainProps = {
  children: ReactNode;
};

export function Main({ children }: MainProps) {
  return <main className="px-4 py-8 mx-auto sm:px-6 lg:px-8">{children}</main>;
}

type MainContentProps = {
  children: ReactNode;
};

export function MainContent({ children }: MainContentProps) {
  return <div className="p-6 bg-white rounded-lg shadow">{children}</div>;
}

type MainGridProps = {
  children: ReactNode;
};

export function MainGrid({ children }: MainGridProps) {
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">{children}</div>;
}

// Compound pattern exports
Main.Content = MainContent;
Main.Grid = MainGrid;
