import { cn } from '../../../utils/cn';
import type { SheetFooterProps } from './Sheet.types';

export function SheetFooter({ children, className }: SheetFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 px-6 py-4 border-t border-gray-200 sm:flex-row sm:justify-end',
        className
      )}
    >
      {children}
    </div>
  );
}
