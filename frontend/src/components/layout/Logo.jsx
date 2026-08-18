import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { WithTooltip } from '@/components/ui/tooltip';

export function Logo({ className, compact = false, to = '/', target, rel }) {
  return (
    <Link
      to={to}
      target={target}
      rel={rel}
      className={cn('flex items-center gap-2 font-display font-semibold tracking-tight text-foreground', className)}
      aria-label="ElectroPoint home"
    >
      <WithTooltip label="Home">
        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-fg">
          EP
        </span>
      </WithTooltip>
      {compact ? null : <span>ElectroPoint</span>}
    </Link>
  );
}
