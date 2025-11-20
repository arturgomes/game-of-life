import { Dialog } from '@ark-ui/react';
import { cn } from '../../../utils/cn';
import type { SheetOverlayProps } from './Sheet.types';

export function SheetOverlay({ className }: SheetOverlayProps) {
  return (
    <Dialog.Backdrop
      className={cn(
        'fixed inset-0 z-[100] bg-black/50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
    />
  );
}
