import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { ProductNameCell } from '@/components/product/ProductThumb';
import { NetworkErrorPage } from '@/pages/errors/ErrorPages';
import { OrderStatusBadge } from '@/components/order/OrderTracker';
import { formatOrderStamp, formatStatusLabel } from '@/lib/orderTracking';
import {
  AdminEmpty,
  AdminHeader,
  AdminLoading,
  ChartTooltip,
  fillSalesDays,
  nprTick,
  StatCard,
  StatusPill,
} from '@/components/admin/AdminChrome';

const ACCENT = '#0A66FF';

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin-analytics'], queryFn: () => adminApi.analytics() });
  if (q.isLoading) return <AdminLoading />;
  if (q.isError) return <NetworkErrorPage onRetry={() => q.refetch()} />;
  const d = q.data || {};
  const series = fillSalesDays(d.salesByDay, 30);
  const topProducts = d.topProducts || [];
  const payments = d.paymentMethodSplit || [];
  const lowStock = d.lowStock || [];
  const recent = d.recentOrders || [];
  const paymentTotal = payments.reduce((sum, row) => sum + (row.count || 0), 0);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Dashboard"
        description="Paid orders only. Today, 7 days, and 30 days are calendar windows from midnight."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatNpr(d.revenuePaisa || 0)} hint={`${d.paidOrders ?? 0} paid orders`} to="/admin/orders" />
        <StatCard label="AOV" value={formatNpr(d.averageOrderValuePaisa || 0)} hint="Average paid order" />
        <StatCard label="Customers" value={d.customerCount ?? 0} to="/admin/customers" />
        <StatCard label="Catalog" value={d.productCount ?? 0} hint="Active products" to="/admin/products" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={formatNpr(d.today?.revenuePaisa || 0)} hint={`${d.today?.orders || 0} paid`} />
        <StatCard label="7 days" value={formatNpr(d.week?.revenuePaisa || 0)} hint={`${d.week?.orders || 0} paid`} />
        <StatCard label="30 days" value={formatNpr(d.month?.revenuePaisa || 0)} hint={`${d.month?.orders || 0} paid`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="border border-border bg-surface p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Revenue · 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={nprTick} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={ACCENT} fill={ACCENT} fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Payments</h2>
            <Link to="/admin/payments" className="text-sm text-accent">
              Ledger
            </Link>
          </div>
          {paymentTotal ? (
            <ul className="mt-4 space-y-4 text-sm">
              {payments.map((row) => {
                const pct = paymentTotal ? Math.round((row.count / paymentTotal) * 100) : 0;
                return (
                  <li key={row.method}>
                    <div className="flex justify-between">
                      <span>{methodName(row.method)}</span>
                      <span className="tabular">{row.count} · {formatNpr(row.revenuePaisa || 0, { compact: true })}</span>
                    </div>
                    <div className="mt-2 h-1 bg-muted-bg">
                      <div className="h-1 bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted">No paid gateway splits yet.</p>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-accent">
            All orders
          </Link>
        </div>
        {recent.length ? (
          <ul className="divide-y divide-border text-sm">
            {recent.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link to={`/admin/orders/${o._id}`} className="font-medium hover:text-accent">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{o.email} · {formatOrderStamp(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="tabular">{formatNpr(o.totalPaisa)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <AdminEmpty title="No orders yet" body="New checkouts will appear here." actionTo="/shop" actionLabel="Open storefront" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Top products</h2>
          {topProducts.length ? (
            <ul className="mt-3 text-sm">
              {topProducts.slice(0, 8).map((p) => (
                <li key={p._id || p.name} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <ProductNameCell product={p} to={p._id ? `/admin/products/${p._id}` : undefined} />
                  <span className="shrink-0 text-right tabular">
                    {p.qty ?? p.sold ?? 0}
                    <span className="block text-xs text-muted">{formatNpr(p.revenuePaisa || 0, { compact: true })}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No paid line items yet.</p>
          )}
        </div>
        <div className="border border-border bg-surface p-4">
          <div className="flex justify-between">
            <h2 className="text-sm font-medium">Low stock</h2>
            <Link to="/admin/inventory" className="text-sm text-accent">
              Inventory
            </Link>
          </div>
          {lowStock.length ? (
            <ul className="mt-3 text-sm">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p._id || p.productId} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <ProductNameCell
                    product={p}
                    to={p.productId || p._id ? `/admin/products/${p.productId || p._id}` : undefined}
                  />
                  <span className="text-warning tabular">{p.available ?? p.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Nothing under the low-stock threshold.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const q = useQuery({ queryKey: ['admin-analytics', 'full'], queryFn: () => adminApi.analytics() });
  if (q.isLoading) return <AdminLoading />;
  if (q.isError) return <NetworkErrorPage onRetry={() => q.refetch()} />;
  const d = q.data || {};
  const cats = (d.topCategories || []).map((row) => ({
    name: row.name || 'Uncategorised',
    revenue: paisaAsNpr(row.revenuePaisa ?? row.revenue ?? 0),
    qty: row.qty || 0,
  }));
  const statuses = d.orderStatusSplit || [];
  const statusMax = Math.max(1, ...statuses.map((s) => s.count || 0));
  const series = fillSalesDays(d.salesByDay, 30);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Analytics"
        description="Aggregated from live orders. Revenue series is the last 30 days. Category and status totals are all-time."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatNpr(d.revenuePaisa || 0)} />
        <StatCard label="Paid orders" value={d.paidOrders ?? 0} />
        <StatCard label="AOV" value={formatNpr(d.averageOrderValuePaisa || 0)} />
        <StatCard label="All orders" value={d.orderCount ?? 0} hint="Includes unpaid and cancelled" />
      </div>
      <div className="border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Orders per day · 30 days</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="orders" name="Orders" fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Categories by revenue</h2>
          {cats.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={nprTick} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill={ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No category revenue yet.</p>
          )}
        </div>
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Order status</h2>
          {statuses.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {statuses.map((s) => {
                const name = s.status || s.name;
                const pct = Math.round(((s.count || 0) / statusMax) * 100);
                return (
                  <li key={name}>
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill status={name} label={formatStatusLabel(name)} />
                      <span className="tabular">{s.count}</span>
                    </div>
                    <div className="mt-2 h-1 bg-muted-bg">
                      <div className="h-1 bg-foreground" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No orders to split.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function paisaAsNpr(paisa) {
  return Number(paisa || 0) / 100;
}

function methodName(method) {
  if (method === 'cod') return 'Cash on delivery';
  if (method === 'esewa') return 'eSewa';
  if (method === 'khalti') return 'Khalti';
  return method || 'Unknown';
}
