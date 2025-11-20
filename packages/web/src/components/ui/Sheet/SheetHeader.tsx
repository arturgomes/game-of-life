import { cn } from '../../../utils/cn';
import type { SheetHeaderProps } from './Sheet.types';

export function SheetHeader({ children, className }: SheetHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col px-6 py-4 space-y-2 text-center border-b border-gray-200 sm:text-left',
        className
      )}
    >
      {children}
    </div>
  );
}
