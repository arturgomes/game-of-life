import { Dialog } from '@ark-ui/react';
import { cn } from '../../../utils/cn';
import type { SheetCloseProps } from './Sheet.types';

export function SheetClose({ className, children }: SheetCloseProps) {
  return (
    <Dialog.CloseTrigger
      className={cn(
        'absolute top-4 right-6 z-10 rounded-sm ring-offset-white opacity-70 transition-opacity',
        'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
        'disabled:pointer-events-none',
        className
      )}
    >
      {children || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <title>Close</title>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )}
      <span className="sr-only">Close</span>
    </Dialog.CloseTrigger>
  );
}
