import { Link } from 'react-router-dom';
import { formatNpr, paisaToNpr } from '@/lib/money';
import { EmptyState } from '@/pages/errors/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Seo } from '@/components/Seo';
import { cn } from '@/lib/cn';

export function AdminHeader({ title, description, actions, seoTitle }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <Seo title={seoTitle || title} noindex />
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminLoading() {
  return <p className="text-sm text-muted">Loading</p>;
}

export function StatCard({ label, value, hint, to }) {
  const inner = (
    <>
      <p className="caption">{label}</p>
      <p className="mt-2 font-display text-2xl tabular">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );
  const className = 'border border-border bg-surface p-4';
  if (to) {
    return (
      <Link to={to} className={cn(className, 'block transition-colors duration-200 hover:border-foreground/30')}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function AdminEmpty({ title, body, actionTo, actionLabel, icon }) {
  return <EmptyState title={title} body={body} actionTo={actionTo} actionLabel={actionLabel} icon={icon} className="py-12" />;
}

export function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (['completed', 'paid', 'active', 'approved', 'delivered', 'success'].includes(s)) return 'success';
  if (['pending', 'initiated', 'payment_pending'].includes(s)) return 'warning';
  if (['failed', 'cancelled', 'expired', 'rejected', 'suspended', 'refunded'].includes(s)) return 'danger';
  return 'muted';
}

export function StatusPill({ status, label }) {
  const text = label || String(status || '').replaceAll('_', ' ');
  return <Badge tone={statusTone(status)}>{text}</Badge>;
}

export function fillSalesDays(rows, days) {
  const map = new Map((rows || []).map((row) => [row.date, row]));
  const out = [];
  const n = days || 30;
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    const row = map.get(key);
    out.push({
      date: key,
      label: `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`,
      revenue: paisaToNpr(row?.revenuePaisa ?? row?.revenue ?? 0),
      orders: row?.orders || 0,
    });
  }
  return out;
}

export function nprTick(value) {
  return formatNpr(Math.round(Number(value || 0) * 100), { compact: true });
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-surface px-3 py-2 text-xs">
      <p className="caption">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 tabular">
          {item.name}: {item.dataKey === 'orders' ? item.value : nprTick(item.value)}
        </p>
      ))}
    </div>
  );
}
