import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WithTooltip } from '@/components/ui/tooltip';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const SIDE_ANIMATION = {
  right: 'data-[state=open]:animate-sheet-right-in data-[state=closed]:animate-sheet-right-out',
  left: 'data-[state=open]:animate-sheet-left-in data-[state=closed]:animate-sheet-left-out',
  bottom: 'data-[state=open]:animate-sheet-bottom-in data-[state=closed]:animate-sheet-bottom-out',
  top: 'data-[state=open]:animate-sheet-top-in data-[state=closed]:animate-sheet-top-out',
};

export function SheetContent({ className, side = 'right', children, title = 'Panel', ...props }) {
  const sides = {
    right: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
    left: 'inset-y-0 left-0 h-full w-full max-w-md border-r',
    bottom: 'inset-x-0 bottom-0 w-full border-t max-h-[90vh]',
    top: 'inset-x-0 top-0 w-full border-b',
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-sheet-overlay-in data-[state=closed]:animate-sheet-overlay-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 overflow-y-auto bg-surface-elevated p-6 shadow-md',
          sides[side],
          SIDE_ANIMATION[side],
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <WithTooltip label="Close">
          <DialogPrimitive.Close
            className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </WithTooltip>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
