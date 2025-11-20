import { Dialog } from '@ark-ui/react';
import type { SheetTriggerProps } from './Sheet.types';

export function SheetTrigger(props: SheetTriggerProps) {
  return <Dialog.Trigger {...props} />;
}
