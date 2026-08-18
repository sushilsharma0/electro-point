import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-fg hover:bg-primary-hover',
        accent: 'bg-accent text-white hover:bg-accent-hover',
        outline: 'border border-border bg-surface hover:border-foreground/30 hover:bg-muted-bg',
        ghost: 'hover:bg-muted-bg',
        link: 'text-accent underline-offset-4 hover:underline px-0',
        danger: 'border border-danger text-danger bg-transparent hover:bg-danger/10',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, tooltip, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const label = tooltip === false ? null : tooltip || (size === 'icon' ? props['aria-label'] : undefined);
  const node = <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  if (!label) return node;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
});

export { buttonVariants };
