import type { ReactNode } from 'react';

type HeaderProps = {
  children?: ReactNode;
};

export function Header({ children }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="px-2 py-2 mx-auto max-w-7xl sm:px-4 lg:px-8">{children}</div>
    </header>
  );
}

type HeaderTitleProps = {
  children: ReactNode;
};

export function HeaderTitle({ children }: HeaderTitleProps) {
  return <h1 className="text-2xl font-bold text-gray-900">{children}</h1>;
}

type HeaderSubtitleProps = {
  children: ReactNode;
};

export function HeaderSubtitle({ children }: HeaderSubtitleProps) {
  return <p className="mt-1 text-sm text-gray-600">{children}</p>;
}

// Compound pattern exports
Header.Title = HeaderTitle;
Header.Subtitle = HeaderSubtitle;
