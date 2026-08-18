import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { WithTooltip } from '@/components/ui/tooltip';

export function EmptyState({
  title,
  body,
  actionTo,
  actionLabel,
  icon: Icon,
  className,
}) {
  return (
    <div className={cn('mx-auto max-w-md py-16 text-center', className)}>
      {Icon ? (
        <WithTooltip label={title}>
          <span className="mx-auto mb-4 inline-flex">
            <Icon className="h-8 w-8 text-muted" />
          </span>
        </WithTooltip>
      ) : null}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
      {actionTo ? (
        <Button asChild className="mt-6">
          <Link to={actionTo}>{actionLabel || 'Continue'}</Link>
        </Button>
      ) : null}
    </div>
  );
}
