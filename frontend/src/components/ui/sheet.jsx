import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({ className, side = 'right', children, title = 'Panel', ...props }) {
  const sides = {
    right: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
    left: 'inset-y-0 left-0 h-full w-full max-w-md border-r',
    bottom: 'inset-x-0 bottom-0 w-full border-t max-h-[90vh]',
    top: 'inset-x-0 top-0 w-full border-b',
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
      <DialogPrimitive.Content
        className={cn('fixed z-50 bg-surface-elevated p-6 shadow-md overflow-y-auto', sides[side], className)}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-1 text-muted hover:text-foreground cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
