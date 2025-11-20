import { Dialog } from '@ark-ui/react';
import { cn } from '../../../utils/cn';
import type { SheetContentProps } from './Sheet.types';

const sideVariants = {
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
};

export function SheetContent({ children, className, side = 'right' }: SheetContentProps) {
  return (
    <Dialog.Positioner className="fixed inset-0 z-[100] flex items-center justify-center">
      <Dialog.Content
        className={cn(
          'fixed z-[100] flex flex-col bg-white shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:duration-300 data-[state=open]:duration-500',
          sideVariants[side],
          className
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Positioner>
  );
}
