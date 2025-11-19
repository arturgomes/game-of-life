import type { ReactNode } from 'react';

type HeaderProps = {
  children?: ReactNode;
};

export function Header({ children }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">{children}</div>
    </header>
  );
}

type HeaderTitleProps = {
  children: ReactNode;
};

export function HeaderTitle({ children }: HeaderTitleProps) {
  return <h1 className="text-3xl font-bold text-gray-900">{children}</h1>;
}

type HeaderSubtitleProps = {
  children: ReactNode;
};

export function HeaderSubtitle({ children }: HeaderSubtitleProps) {
  return <p className="text-sm text-gray-600 mt-1">{children}</p>;
}

// Compound pattern exports
Header.Title = HeaderTitle;
Header.Subtitle = HeaderSubtitle;
