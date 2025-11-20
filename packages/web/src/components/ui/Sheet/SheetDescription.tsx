import { Dialog } from '@ark-ui/react';
import type { SheetDescriptionProps } from './Sheet.types';

export function SheetDescription(props: SheetDescriptionProps) {
  return <Dialog.Description className="text-sm text-gray-600" {...props} />;
}
