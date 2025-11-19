import type { ReactNode } from 'react';

type FooterProps = {
  children?: ReactNode;
};

export function Footer({ children }: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">{children}</div>
    </footer>
  );
}

type FooterTextProps = {
  children: ReactNode;
};

export function FooterText({ children }: FooterTextProps) {
  return <p className="text-sm text-gray-600 text-center">{children}</p>;
}

type FooterLinksProps = {
  children: ReactNode;
};

export function FooterLinks({ children }: FooterLinksProps) {
  return <div className="flex justify-center space-x-4 mt-2">{children}</div>;
}

// Compound pattern exports
Footer.Text = FooterText;
Footer.Links = FooterLinks;
