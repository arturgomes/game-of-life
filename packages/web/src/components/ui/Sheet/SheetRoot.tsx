import { Dialog } from '@ark-ui/react';
import type { SheetRootProps } from './Sheet.types';

export function SheetRoot({ lazyMount = true, unmountOnExit = true, ...props }: SheetRootProps) {
  return <Dialog.Root lazyMount={lazyMount} unmountOnExit={unmountOnExit} {...props} />;
}
