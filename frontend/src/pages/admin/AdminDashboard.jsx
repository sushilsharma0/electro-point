import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Pie, PieChart, Cell } from 'recharts';
import { adminApi } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { Seo } from '@/components/Seo';
import { NetworkErrorPage } from '@/pages/errors/ErrorPages';

const ACCENT = '#0A66FF';

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin-analytics'], queryFn: () => adminApi.analytics() });
  if (q.isLoading) return null;
  if (q.isError) return <NetworkErrorPage onRetry={() => q.refetch()} />;
  const d = q.data || {};
  const kpis = [
    { label: 'Revenue', value: formatNpr(d.revenuePaisa || 0) },
    { label: 'Orders', value: d.paidOrders ?? d.orderCount ?? 0 },
    { label: 'AOV', value: formatNpr(d.averageOrderValuePaisa || 0) },
    { label: 'Customers', value: d.customerCount ?? 0 },
  ];
  const series = (d.salesByDay || []).map((row) => ({
    date: row.date,
    revenue: row.revenuePaisa ?? row.revenue ?? 0,
  }));
  const topProducts = d.topProducts || [];
  const payments = d.paymentMethodSplit || [];
  const lowStock = d.lowStock || [];

  return (
    <div className="space-y-8">
      <Seo title="Admin dashboard" noindex />
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-border bg-surface p-4">
            <p className="caption">{k.label}</p>
            <p className="mt-2 font-display text-2xl tabular">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="border border-border bg-surface p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Revenue</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke={ACCENT} fill={ACCENT} fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Payments</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payments} dataKey="count" nameKey="method" innerRadius={50} outerRadius={80}>
                  {payments.map((_, i) => (
                    <Cell key={i} fill={i ? '#1C2128' : ACCENT} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Top products</h2>
          <ul className="mt-3 text-sm">
            {topProducts.map((p) => (
              <li key={p._id || p.name} className="flex justify-between border-b border-border py-2">
                <span>{p.name}</span>
                <span className="tabular">{p.sold ?? p.qty}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-border bg-surface p-4">
          <div className="flex justify-between">
            <h2 className="text-sm font-medium">Low stock</h2>
            <Link to="/admin/inventory" className="text-sm text-accent">
              Inventory
            </Link>
          </div>
          <ul className="mt-3 text-sm">
            {lowStock.map((p) => (
              <li key={p._id} className="flex justify-between border-b border-border py-2">
                <span>{p.name}</span>
                <span className="text-warning tabular">{p.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const q = useQuery({ queryKey: ['admin-analytics', 'full'], queryFn: () => adminApi.analytics({ range: '90d' }) });
  if (q.isLoading) return null;
  const d = q.data || {};
  const cats = (d.topCategories || []).map((row) => ({
    ...row,
    revenue: row.revenuePaisa ?? row.revenue ?? 0,
  }));
  const statuses = d.orderStatusSplit || [];
  return (
    <div className="space-y-8">
      <Seo title="Analytics" noindex />
      <h1 className="font-display text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-muted">Figures are aggregated from paid orders. Nothing here is simulated.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Categories</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Order status</h2>
          <ul className="mt-3 text-sm">
            {statuses.map((s) => (
              <li key={s.status || s.name} className="flex justify-between py-2 border-b border-border">
                <span>{s.status || s.name}</span>
                <span className="tabular">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
