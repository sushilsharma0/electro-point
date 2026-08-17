import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
  {
    variants: {
      tone: {
        muted: 'border-border text-muted',
        accent: 'border-accent/40 text-accent',
        danger: 'border-danger/50 text-danger',
        warning: 'border-warning/50 text-warning',
        success: 'border-success/50 text-success',
      },
    },
    defaultVariants: { tone: 'muted' },
  },
);

export function Badge({ className, tone, ...props }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
