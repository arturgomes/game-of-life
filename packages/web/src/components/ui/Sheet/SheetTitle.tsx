import { Dialog } from '@ark-ui/react';
import type { SheetTitleProps } from './Sheet.types';

export function SheetTitle(props: SheetTitleProps) {
  return <Dialog.Title className="text-lg font-semibold" {...props} />;
}
