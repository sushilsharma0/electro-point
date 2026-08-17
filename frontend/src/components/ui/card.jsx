import { cn } from '@/lib/cn';

export function Card({ className, ...props }) {
  return <div className={cn('border border-border bg-surface', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-4 pb-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-base font-semibold', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-4', className)} {...props} />;
}
