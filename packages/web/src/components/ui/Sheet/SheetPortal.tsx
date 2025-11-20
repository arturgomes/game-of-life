import { Portal } from '@ark-ui/react';
import type { SheetPortalProps } from './Sheet.types';

export function SheetPortal({ children }: SheetPortalProps) {
  return <Portal>{children}</Portal>;
}
