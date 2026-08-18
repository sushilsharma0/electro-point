import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 6, side = 'bottom', ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-[80] max-w-xs border border-border bg-foreground px-2 py-1 text-xs text-background shadow-md',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

export function WithTooltip({ label, children, side = 'bottom' }) {
  if (!label) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
