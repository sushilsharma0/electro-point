import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/cn';

export function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn('text-[13px] font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-danger">
      {children}
    </p>
  );
}
