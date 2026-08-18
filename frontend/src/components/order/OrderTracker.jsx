import { Check, ClipboardCheck, Copy, ExternalLink, MapPin, Package, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import {
  TRACKING_STEPS,
  TERMINAL_STATUSES,
  STATUS_META,
  formatOrderDay,
  formatOrderStamp,
  formatStatusLabel,
  hasShipmentTracking,
  paymentLabel,
  statusTone,
  trackingStepIndex,
} from '@/lib/orderTracking';
import { toast } from 'sonner';

const STEP_ICONS = [ClipboardCheck, Package, Package, Truck, MapPin, Check];

function copyText(value, label) {
  if (!value) return;
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'));
}

export function OrderStatusBadge({ status, className }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {formatStatusLabel(status)}
    </Badge>
  );
}

export function OrderProgressBar({ status, className }) {
  const current = trackingStepIndex(status);
  const failed = TERMINAL_STATUSES.has(status);
  return (
    <div className={cn('flex items-center gap-1', className)} aria-hidden="true">
      {TRACKING_STEPS.map((step, i) => (
        <span
          key={step.key}
          className={cn(
            'h-1 flex-1 rounded-sm',
            failed ? 'bg-danger/30' : i <= current ? 'bg-accent' : 'bg-border',
          )}
        />
      ))}
    </div>
  );
}

function StepNode({ index, current, failed }) {
  const Icon = STEP_ICONS[index] || Package;
  const done = !failed && index < current;
  const now = !failed && index === current;
  return (
    <span
      className={cn(
        'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface transition-colors duration-200',
        done && 'border-foreground bg-foreground text-primary-fg',
        now && 'ep-tracker-now border-accent text-accent',
        !done && !now && 'border-border text-muted',
        failed && 'border-danger/50 text-danger',
      )}
    >
      {done ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
    </span>
  );
}

export function OrderStepper({ status }) {
  const current = trackingStepIndex(status);
  const failed = TERMINAL_STATUSES.has(status) || current < 0;
  return (
    <ol className="hidden md:flex" aria-label="Shipment progress">
      {TRACKING_STEPS.map((step, i) => {
        const last = i === TRACKING_STEPS.length - 1;
        const filled = !failed && i < current;
        return (
          <li key={step.key} className={cn('min-w-0', last ? 'w-9' : 'flex-1')} aria-current={i === current ? 'step' : undefined}>
            <div className="flex items-center">
              <StepNode index={i} current={current} failed={failed} />
              {last ? null : (
                <span
                  className={cn('mx-2 h-px min-w-4 flex-1', filled ? 'bg-foreground' : 'bg-border')}
                  aria-hidden
                />
              )}
            </div>
            <p className={cn('mt-2 text-xs', i === current ? 'font-medium text-foreground' : 'text-muted')}>
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderStepperMobile({ status }) {
  const current = trackingStepIndex(status);
  const failed = TERMINAL_STATUSES.has(status) || current < 0;
  return (
    <ol className="space-y-0 md:hidden" aria-label="Shipment progress">
      {TRACKING_STEPS.map((step, i) => {
        const last = i === TRACKING_STEPS.length - 1;
        const filled = !failed && i < current;
        return (
          <li key={step.key} className="flex gap-3" aria-current={i === current ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <StepNode index={i} current={current} failed={failed} />
              {last ? null : <span className={cn('w-px flex-1', filled ? 'bg-foreground' : 'bg-border')} aria-hidden />}
            </div>
            <p className={cn('pb-6 pt-2 text-sm', i === current ? 'font-medium text-foreground' : 'text-muted')}>
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ShipmentCard({ tracking, shippingMethod }) {
  if (!hasShipmentTracking(tracking) && !shippingMethod) return null;
  const eta = formatOrderDay(tracking?.estimatedDelivery);
  return (
    <section className="border border-border bg-surface p-5">
      <p className="caption">Shipment</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {shippingMethod ? (
          <div>
            <dt className="caption">Method</dt>
            <dd className="mt-1 text-sm">{shippingMethod}</dd>
          </div>
        ) : null}
        {tracking?.carrier ? (
          <div>
            <dt className="caption">Courier</dt>
            <dd className="mt-1 text-sm">{tracking.carrier}</dd>
          </div>
        ) : null}
        {tracking?.trackingNumber ? (
          <div>
            <dt className="caption">Tracking number</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="spec-text">{tracking.trackingNumber}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Copy tracking number"
                onClick={() => copyText(tracking.trackingNumber, 'Tracking number')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </dd>
          </div>
        ) : null}
        {eta ? (
          <div>
            <dt className="caption">Estimated delivery</dt>
            <dd className="mt-1 text-sm">{eta}</dd>
          </div>
        ) : null}
        {tracking?.lastLocation ? (
          <div className="sm:col-span-2">
            <dt className="caption">Last location</dt>
            <dd className="mt-1 text-sm">{tracking.lastLocation}</dd>
          </div>
        ) : null}
      </dl>
      {tracking?.trackingUrl ? (
        <a
          href={tracking.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-accent transition-colors duration-200 hover:text-accent-hover"
        >
          Open courier tracking
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </section>
  );
}

export function OrderTimeline({ timeline }) {
  const events = [...(timeline || [])].sort((a, b) => new Date(a.at) - new Date(b.at));
  if (!events.length) return null;
  return (
    <section>
      <h3 className="font-display text-lg font-semibold">Activity</h3>
      <ol className="relative mt-4 space-y-0 border-l border-border pl-5">
        {events.map((event, i) => (
          <li key={`${event.status}-${event.at}-${i}`} className="relative pb-6 last:pb-0">
            <span
              className={cn(
                'absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border bg-surface',
                i === events.length - 1 ? 'border-accent bg-accent' : 'border-foreground',
              )}
              aria-hidden
            />
            <p className="text-sm font-medium">{formatStatusLabel(event.status)}</p>
            {event.note ? <p className="mt-0.5 text-sm text-muted">{event.note}</p> : null}
            <p className="mt-1 spec-text text-xs text-muted">{formatOrderStamp(event.at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OrderTracker({ order, className }) {
  const meta = STATUS_META[order.status] || {
    title: formatStatusLabel(order.status),
    body: '',
    tone: 'muted',
  };
  return (
    <div className={cn('space-y-8', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="caption">Status</p>
          <h2 className="mt-1 font-display text-h2">{meta.title}</h2>
          {meta.body ? <p className="mt-2 max-w-xl text-sm text-muted">{meta.body}</p> : null}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {paymentLabel(order) ? <p className="text-sm text-muted">{paymentLabel(order)}</p> : null}
      <OrderStepper status={order.status} />
      <OrderStepperMobile status={order.status} />
      <ShipmentCard tracking={order.tracking} shippingMethod={order.shippingMethod} />
      <OrderTimeline timeline={order.timeline} />
    </div>
  );
}
