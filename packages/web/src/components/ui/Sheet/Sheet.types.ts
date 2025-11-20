import type { Dialog } from '@ark-ui/react';
import type { ReactNode } from 'react';

// Re-export Ark UI Dialog types for convenience
export type SheetRootProps = Dialog.RootProps;
export type SheetTriggerProps = Dialog.TriggerProps;
export type SheetTitleProps = Dialog.TitleProps;
export type SheetDescriptionProps = Dialog.DescriptionProps;

// Custom props for styled wrappers
export type SheetPortalProps = {
  children: ReactNode;
};

export type SheetOverlayProps = {
  className?: string;
};

export type SheetContentProps = {
  children: ReactNode;
  className?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
};

export type SheetCloseProps = {
  className?: string;
  children?: ReactNode;
};

export type SheetHeaderProps = {
  children: ReactNode;
  className?: string;
};

export type SheetBodyProps = {
  children: ReactNode;
  className?: string;
};

export type SheetFooterProps = {
  children: ReactNode;
  className?: string;
};
