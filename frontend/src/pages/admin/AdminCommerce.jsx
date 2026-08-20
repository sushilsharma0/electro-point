import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2 } from 'lucide-react';
import { adminApi, listFrom, metaFrom } from '@/lib/api';
import { formatNpr, nprToPaisa } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ProductNameCell } from '@/components/product/ProductThumb';
import { OrderStatusBadge } from '@/components/order/OrderTracker';
import { formatOrderDay, formatOrderStamp, formatStatusLabel } from '@/lib/orderTracking';
import { AdminEmpty, AdminHeader, AdminLoading, StatCard, StatusPill } from '@/components/admin/AdminChrome';
import { WithTooltip } from '@/components/ui/tooltip';

export function AdminCustomersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const query = useQuery({
    queryKey: ['admin-customers', q, status],
    queryFn: () => adminApi.customers({ limit: 50, q: q || undefined, status: status === 'all' ? undefined : status }),
  });
  const mut = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateCustomer(id, body),
    onSuccess: () => {
      toast.success('Customer updated');
      query.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const customers = listFrom(query.data);
  const meta = metaFrom(query.data);
  if (query.isLoading) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Customers"
        description={`${meta.total || customers.length} accounts. Spend is from paid orders only.`}
      />
      <div className="flex flex-wrap gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone"
          className="max-w-xs"
          aria-label="Search customers"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {customers.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c._id}>
                <TableCell>
                  <Link to={`/admin/customers/${c._id}`} className="font-medium hover:text-accent">
                    {c.name || '—'}
                  </Link>
                  <p className="text-xs text-muted">{c.email}</p>
                  {c.phone ? <p className="text-xs text-muted">{c.phone}</p> : null}
                </TableCell>
                <TableCell>
                  <StatusPill status={c.status} />
                </TableCell>
                <TableCell className="tabular">{c.paidOrders ?? 0}</TableCell>
                <TableCell className="tabular">{formatNpr(c.spendPaisa || 0)}</TableCell>
                <TableCell className="text-muted">{formatOrderDay(c.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = c.status === 'suspended' ? 'active' : 'suspended';
                      if (next === 'suspended' && !window.confirm(`Suspend ${c.email}? They will not be able to check out.`)) return;
                      mut.mutate({ id: c._id, body: { status: next } });
                    }}
                  >
                    {c.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty title="No customers" body="Accounts appear here after registration." />
      )}
    </div>
  );
}

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-customer', id], queryFn: () => adminApi.customer(id) });
  const mut = useMutation({
    mutationFn: (body) => adminApi.updateCustomer(id, body),
    onSuccess: () => {
      toast.success('Customer updated');
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (q.isLoading) return <AdminLoading />;
  const payload = q.data || {};
  const user = payload.user || payload;
  const orders = payload.orders || [];
  const addresses = payload.addresses || [];
  const status = user.status;
  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/customers" className="text-sm text-accent">
          All customers
        </Link>
        <AdminHeader
          title={user.name || 'Customer'}
          description={user.email}
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next = status === 'suspended' ? 'active' : 'suspended';
                if (next === 'suspended' && !window.confirm(`Suspend ${user.email}?`)) return;
                mut.mutate({ status: next });
              }}
            >
              {status === 'suspended' ? 'Activate' : 'Suspend'}
            </Button>
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Status" value={status || '—'} />
        <StatCard label="Paid orders" value={payload.paidOrders ?? 0} />
        <StatCard label="Spent" value={formatNpr(payload.spendPaisa || 0)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-surface p-5">
          <p className="caption">Contact</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="mt-1">{user.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Last login</dt>
              <dd className="mt-1">{formatOrderStamp(user.lastLoginAt) || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Joined</dt>
              <dd className="mt-1">{formatOrderStamp(user.createdAt) || '—'}</dd>
            </div>
          </dl>
        </section>
        <section className="border border-border bg-surface p-5">
          <p className="caption">Addresses</p>
          {addresses.length ? (
            <ul className="mt-4 space-y-4 text-sm">
              {addresses.map((a) => (
                <li key={a._id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="font-medium">{a.fullName || a.label || 'Address'}</p>
                  <p className="text-muted">
                    {[a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No saved addresses.</p>
          )}
        </section>
      </div>
      <section>
        <h2 className="text-sm font-medium">Orders</h2>
        {orders.length ? (
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>
                    <Link to={`/admin/orders/${o._id}`} className="hover:text-accent">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="tabular">{formatNpr(o.totalPaisa)}</TableCell>
                  <TableCell className="text-muted">{formatOrderStamp(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="mt-3 text-sm text-muted">No orders.</p>
        )}
      </section>
    </div>
  );
}

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-coupons'], queryFn: () => adminApi.coupons({ limit: 50 }) });
  const coupons = listFrom(q.data);
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '10',
    minNpr: '0',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });
  const create = useMutation({
    mutationFn: adminApi.createCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setForm({ code: '', type: 'percent', value: '10', minNpr: '0', usageLimit: '', expiresAt: '', isActive: true });
    },
    onError: (e) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateCoupon(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: adminApi.deleteCoupon,
    onSuccess: () => {
      toast.success('Coupon deleted');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (q.isLoading) return <AdminLoading />;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-6">
        <AdminHeader title="Coupons" description="Percent off catalog, or a fixed NPR amount. Usage is counted on paid orders." />
        {coupons.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>On</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>
                    {c.type === 'percent' ? `${c.value}%` : formatNpr(c.value)}
                  </TableCell>
                  <TableCell className="tabular">{c.minOrderPaisa ? formatNpr(c.minOrderPaisa, { compact: true }) : '—'}</TableCell>
                  <TableCell className="tabular">
                    {c.usedCount || 0}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </TableCell>
                  <TableCell className="text-muted">{c.expiresAt ? formatOrderDay(c.expiresAt) : '—'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(c.isActive)}
                      onCheckedChange={(v) => patch.mutate({ id: c._id, body: { isActive: v } })}
                      aria-label={`Toggle ${c.code}`}
                    />
                  </TableCell>
                  <TableCell>
                    <WithTooltip label="Delete">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${c.code}`}
                        onClick={() => {
                          if (!window.confirm(`Delete coupon ${c.code}?`)) return;
                          remove.mutate(c._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </WithTooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <AdminEmpty title="No coupons" body="Create a code to discount eligible checkout totals." />
        )}
      </div>
      <form
        className="h-fit space-y-4 border border-border bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const valueNum = Number(form.value);
          create.mutate({
            code: form.code,
            type: form.type,
            value: form.type === 'percent' ? valueNum : nprToPaisa(valueNum),
            minOrderPaisa: nprToPaisa(form.minNpr),
            usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
            expiresAt: form.expiresAt || null,
            isActive: form.isActive,
          });
        }}
      >
        <h2 className="font-display text-base font-semibold">New coupon</h2>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" className="mt-1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={form.type} onValueChange={(type) => setForm({ ...form, type, value: type === 'percent' ? '10' : '500' })}>
            <SelectTrigger id="type" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="fixed">Fixed NPR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">{form.type === 'percent' ? 'Percent' : 'Amount (NPR)'}</Label>
          <Input id="value" type="number" min="0" className="mt-1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="min">Minimum order (NPR)</Label>
          <Input id="min" type="number" min="0" className="mt-1" value={form.minNpr} onChange={(e) => setForm({ ...form, minNpr: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="limit">Usage limit</Label>
          <Input id="limit" type="number" min="0" className="mt-1" placeholder="Unlimited" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="exp">Expires</Label>
          <Input id="exp" type="date" className="mt-1" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
        <label className="flex items-center justify-between text-sm">
          Active
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
        </label>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create coupon'}
        </Button>
      </form>
    </div>
  );
}

export function AdminPaymentsPage() {
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const q = useQuery({
    queryKey: ['admin-payments', status, method],
    queryFn: () =>
      adminApi.payments({
        limit: 50,
        status: status === 'all' ? undefined : status,
        method: method === 'all' ? undefined : method,
      }),
  });
  const payments = listFrom(q.data);
  const meta = metaFrom(q.data);
  const completed = useMemo(
    () => payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amountPaisa || 0), 0),
    [payments],
  );
  if (q.isLoading) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Payments"
        description="eSewa and Khalti lookups. COD is collected on delivery and does not create a gateway row."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rows" value={meta.total || payments.length} />
        <StatCard label="Completed on this page" value={formatNpr(completed)} />
        <StatCard label="Filter" value={`${status === 'all' ? 'All' : status} · ${method === 'all' ? 'all methods' : method}`} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" aria-label="Filter payment status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['all', 'initiated', 'pending', 'completed', 'failed', 'cancelled', 'expired', 'refunded'].map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : formatStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40" aria-label="Filter method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="esewa">eSewa</SelectItem>
            <SelectItem value="khalti">Khalti</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {payments.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Txn</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const order = p.order && typeof p.order === 'object' ? p.order : null;
              const user = p.user && typeof p.user === 'object' ? p.user : null;
              return (
                <TableRow key={p._id}>
                  <TableCell>{p.method === 'esewa' ? 'eSewa' : p.method === 'khalti' ? 'Khalti' : p.method}</TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="tabular">{formatNpr(p.amountPaisa)}</TableCell>
                  <TableCell>
                    {user?._id ? (
                      <Link to={`/admin/customers/${user._id}`} className="hover:text-accent">
                        {user.name || user.email}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {order?._id ? (
                      <Link to={`/admin/orders/${order._id}`} className="hover:text-accent">
                        {order.orderNumber}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted">{p.gatewayTxnId || p.pidx || p.transactionUuid || '—'}</TableCell>
                  <TableCell className="text-muted">{formatOrderStamp(p.verifiedAt || p.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty title="No payments" body="Gateway attempts appear after a customer starts eSewa or Khalti." />
      )}
    </div>
  );
}

export function AdminReviewsPage() {
  const [status, setStatus] = useState('all');
  const q = useQuery({
    queryKey: ['admin-reviews', status],
    queryFn: () => adminApi.reviews({ limit: 50, status: status === 'all' ? undefined : status }),
  });
  const reviews = listFrom(q.data);
  const mut = useMutation({
    mutationFn: ({ id, next }) => adminApi.updateReview(id, { status: next }),
    onSuccess: () => {
      toast.success('Review updated');
      q.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  if (q.isLoading) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminHeader title="Reviews" description="Approve verified buyer notes before they show on the product page, unless auto-approve is on." />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44" aria-label="Filter reviews">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      {reviews.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r._id}>
                <TableCell>
                  <ProductNameCell product={r.product} name={r.product?.name || r.product} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 tabular">
                    <Star className="h-3.5 w-3.5" />
                    {r.rating}
                  </span>
                </TableCell>
                <TableCell className="max-w-sm">
                  <p className="line-clamp-2 text-sm">{r.title || r.body || '—'}</p>
                  <p className="text-xs text-muted">{formatOrderStamp(r.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <StatusPill status={r.status} />
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => mut.mutate({ id: r._id, next: 'approved' })}>
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => mut.mutate({ id: r._id, next: 'rejected' })}>
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty title="No reviews" body="Submitted ratings land here for moderation." />
      )}
    </div>
  );
}
