import { cn } from '@/lib/cn';

export function Progress({ value = 0, className }) {
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-sm bg-muted-bg', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
