import { cn } from '@/lib/cn';

export function CheckoutPanel({ kicker, title, body, children }) {
  return (
    <section className="border border-border bg-surface p-6 sm:p-8">
      {kicker ? <p className="caption">{kicker}</p> : null}
      {title ? <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">{title}</h2> : null}
      {body ? <p className="mt-2 max-w-lg text-sm text-muted">{body}</p> : null}
      <div className={cn((kicker || title || body) && 'mt-6')}>{children}</div>
    </section>
  );
}

export function CheckoutActions({ children }) {
  return <div className="mt-8 flex flex-wrap gap-3">{children}</div>;
}
