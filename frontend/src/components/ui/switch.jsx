import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors duration-200 data-[state=checked]:bg-accent data-[state=unchecked]:bg-muted-bg focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-surface shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
    </SwitchPrimitive.Root>
  );
}
