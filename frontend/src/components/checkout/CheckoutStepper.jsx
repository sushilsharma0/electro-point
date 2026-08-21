import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export function CheckoutStepper({ steps, current, onSelect }) {
  const last = steps.length - 1;
  return (
    <ol className="flex items-start">
      {steps.map((label, i) => {
        const state = stepState(i, current);
        const clickable = state === 'done' && typeof onSelect === 'function';
        const leftOn = i !== 0 && current - i >= 0;
        const rightOn = i !== last && current - i >= 1;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-start">
            <button
              type="button"
              disabled={!clickable}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={`${label}, step ${i + 1} of ${steps.length}${state === 'done' ? ', completed' : ''}`}
              onClick={() => clickable && onSelect(i)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-2 text-center',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span className="flex w-full items-center">
                <span className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : leftOn ? 'bg-foreground' : 'bg-border')} />
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular transition-colors duration-200',
                    state === 'current' && 'border-accent bg-accent text-white',
                    state === 'done' && 'border-foreground bg-foreground text-primary-fg',
                    state === 'todo' && 'border-border bg-surface text-muted',
                  )}
                >
                  {state === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className={cn('h-px flex-1', i === last ? 'bg-transparent' : rightOn ? 'bg-foreground' : 'bg-border')} />
              </span>
              <span
                className={cn(
                  'hidden px-1 text-[10px] font-medium uppercase tracking-wide sm:block',
                  state === 'todo' ? 'text-muted' : 'text-foreground',
                )}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function stepState(index, current) {
  if (index === current) return 'current';
  if (current - index >= 1) return 'done';
  return 'todo';
}
