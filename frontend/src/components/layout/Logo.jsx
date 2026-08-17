import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Logo({ className, compact = false }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 font-display font-semibold tracking-tight text-foreground', className)} aria-label="ElectroPoint home">
      <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-fg">
        EP
      </span>
      {compact ? null : <span>ElectroPoint</span>}
    </Link>
  );
}
