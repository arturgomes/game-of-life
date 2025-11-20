import { cn } from '../../../utils/cn';
import type { SheetBodyProps } from './Sheet.types';

export function SheetBody({ children, className }: SheetBodyProps) {
  return <div className={cn('overflow-y-auto flex-1 px-6 py-4', className)}>{children}</div>;
}
