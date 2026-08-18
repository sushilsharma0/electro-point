import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WithTooltip } from '@/components/ui/tooltip';

export function RatingStars({ value = 0, count, size = 'sm' }) {
  const v = Number(value) || 0;
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <WithTooltip label={`Rated ${v.toFixed(1)} out of 5${count != null ? ` · ${count} reviews` : ''}`}>
      <div className="flex items-center gap-1.5" aria-label={`Rated ${v.toFixed(1)} out of 5`}>
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(cls, i < Math.round(v) ? 'fill-[var(--star)] text-[var(--star)]' : 'text-border')}
              aria-hidden
            />
          ))}
        </span>
        <span className="text-xs text-muted tabular">
          {v ? v.toFixed(1) : '—'}
          {count != null ? ` (${count})` : ''}
        </span>
      </div>
    </WithTooltip>
  );
}
