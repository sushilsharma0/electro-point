import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, listFrom } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { OrderProgressBar, OrderStatusBadge, OrderTracker } from '@/components/order/OrderTracker';
import { AdminShipmentForm, ORDER_STATUSES } from '@/components/order/AdminShipmentForm';

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-categories'], queryFn: () => adminApi.categories() });
  const cats = listFrom(q.data);
  const [form, setForm] = useState({ name: '', slug: '', parent: '', isActive: true, isFeatured: false, showOnHomepage: false });
  const create = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category created');
    },
    onError: (e) => toast.error(e.message),
  });

  if (q.isLoading) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Seo title="Categories" noindex />
      <div>
        <h1 className="font-display text-2xl font-semibold">Categories</h1>
        <ul className="mt-4 text-sm">
          {cats.map((c) => (
            <CategoryNode key={c._id} node={c} depth={0} />
          ))}
        </ul>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            ...form,
            parent: form.parent || null,
          });
        }}
      >
        <h2 className="font-medium">New category</h2>
        <div>
          <Label htmlFor="cname">Name</Label>
          <Input id="cname" className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="cslug">Slug</Label>
          <Input id="cslug" className="mt-1" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cparent">Parent</Label>
          <select id="cparent" className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
            <option value="">None</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center justify-between text-sm">
          Active <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Featured <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Homepage <Switch checked={form.showOnHomepage} onCheckedChange={(v) => setForm({ ...form, showOnHomepage: v })} />
        </label>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}

function CategoryNode({ node, depth }) {
  return (
    <li className="border-b border-border py-2" style={{ paddingLeft: depth * 16 }}>
      {node.name} <span className="text-muted">/{node.slug}</span>
      {node.children?.length ? (
        <ul>
          {node.children.map((ch) => (
            <CategoryNode key={ch._id} node={ch} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['admin-orders', status], queryFn: () => adminApi.orders({ status, limit: 50 }) });
  const orders = listFrom(q.data);
  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Orders" noindex />
      <h1 className="font-display text-2xl font-semibold">Orders</h1>
      <select className="my-4 h-10 rounded-md border border-border bg-surface px-3" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
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
              <TableCell className="min-w-[140px]">
                <OrderProgressBar status={o.status} />
              </TableCell>
              <TableCell className="tabular">{formatNpr(o.totalPaisa)}</TableCell>
              <TableCell>{o.payment?.method} {o.payment?.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['admin-order', id], queryFn: () => adminApi.order(id) });
  const order = q.data?.order || q.data;
  if (q.isLoading || !order) return null;
  const customer = order.user;
  return (
    <div className="space-y-8">
      <Seo title={order.orderNumber} noindex />
      <div>
        <Link to="/admin/orders" className="text-sm text-accent transition-colors duration-200 hover:text-accent-hover">
          All orders
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{order.orderNumber}</h1>
        {customer?.email ? (
          <p className="mt-1 text-sm text-muted">
            {customer.name || 'Customer'} · {customer.email}
          </p>
        ) : null}
      </div>
      <OrderTracker order={order} />
      <AdminShipmentForm order={order} />
      <ul className="border border-border text-sm">
        {(order.items || []).map((it, i) => (
          <li key={i} className="flex justify-between border-b border-border px-4 py-2 last:border-b-0">
            <span>
              {it.name} × {it.qty}
            </span>
            <span className="tabular">{formatNpr(it.lineTotalPaisa)}</span>
          </li>
        ))}
      </ul>
      <p className="font-semibold">Total {formatNpr(order.totalPaisa)}</p>
      {order.address ? (
        <p className="text-sm text-muted">
          {order.address.fullName} · {order.address.line1}, {order.address.city}
        </p>
      ) : null}
    </div>
  );
}

export function AdminCustomersPage() {
  const q = useQuery({ queryKey: ['admin-customers'], queryFn: () => adminApi.customers({ limit: 50 }) });
  const customers = listFrom(q.data);
  const mut = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateCustomer(id, body),
    onSuccess: () => q.refetch(),
  });
  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Customers" noindex />
      <h1 className="font-display text-2xl font-semibold">Customers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c._id}>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => mut.mutate({ id: c._id, body: { status: c.status === 'suspended' ? 'active' : 'suspended' } })}
                >
                  {c.status === 'suspended' ? 'Activate' : 'Suspend'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminInventoryPage() {
  const q = useQuery({ queryKey: ['admin-inventory'], queryFn: () => adminApi.inventory({ limit: 50 }) });
  const rows = listFrom(q.data);
  const [reason, setReason] = useState('manual');
  const [qty, setQty] = useState(0);
  const [productId, setProductId] = useState('');
  const mut = useMutation({
    mutationFn: adminApi.adjustInventory,
    onSuccess: () => {
      q.refetch();
      toast.success('Stock adjusted');
    },
    onError: (e) => toast.error(e.message),
  });
  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Inventory" noindex />
      <h1 className="font-display text-2xl font-semibold">Inventory</h1>
      <form
        className="my-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({ productId, qtyDelta: Number(qty), reason, type: reason === 'restock' || reason === 'refund' || reason === 'correction' ? reason : 'manual' });
        }}
      >
        <div>
          <Label htmlFor="pid">Product ID</Label>
          <Input id="pid" className="mt-1" value={productId} onChange={(e) => setProductId(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="qty">Qty delta</Label>
          <Input id="qty" type="number" className="mt-1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="reason">Reason</Label>
          <select id="reason" className="mt-1 h-10 rounded-md border border-border bg-surface px-3" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="restock">Restock</option>
            <option value="refund">Refund</option>
            <option value="correction">Correction</option>
          </select>
        </div>
        <Button type="submit">Adjust</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.name || r.product?.name}</TableCell>
              <TableCell className="tabular">{r.stock}</TableCell>
              <TableCell className="tabular">{r.reservedStock}</TableCell>
              <TableCell className="tabular">{(r.stock || 0) - (r.reservedStock || 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-coupons'], queryFn: () => adminApi.coupons() });
  const coupons = listFrom(q.data);
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, minOrderPaisa: 0, isActive: true });
  const create = useMutation({
    mutationFn: adminApi.createCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
    },
    onError: (e) => toast.error(e.message),
  });
  if (q.isLoading) return null;
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Seo title="Coupons" noindex />
      <div>
        <h1 className="font-display text-2xl font-semibold">Coupons</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.value}</TableCell>
                <TableCell>{c.isActive ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ ...form, value: Number(form.value), minOrderPaisa: Number(form.minOrderPaisa) });
        }}
      >
        <h2 className="font-medium">New coupon</h2>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" className="mt-1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select id="type" className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed (paisa)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input id="value" type="number" className="mt-1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="min">Min order (paisa)</Label>
          <Input id="min" type="number" className="mt-1" value={form.minOrderPaisa} onChange={(e) => setForm({ ...form, minOrderPaisa: e.target.value })} />
        </div>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}

export function AdminReviewsPage() {
  const q = useQuery({ queryKey: ['admin-reviews'], queryFn: () => adminApi.reviews({ limit: 50 }) });
  const reviews = listFrom(q.data);
  const mut = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateReview(id, { status }),
    onSuccess: () => q.refetch(),
  });
  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Reviews" noindex />
      <h1 className="font-display text-2xl font-semibold">Reviews</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.product?.name || r.product}</TableCell>
              <TableCell>{r.rating}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell className="space-x-2">
                <Button type="button" size="sm" variant="outline" onClick={() => mut.mutate({ id: r._id, status: 'approved' })}>
                  Approve
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => mut.mutate({ id: r._id, status: 'rejected' })}>
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminPaymentsPage() {
  const q = useQuery({ queryKey: ['admin-payments'], queryFn: () => adminApi.payments({ limit: 50 }) });
  const payments = listFrom(q.data);
  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Payments" noindex />
      <h1 className="font-display text-2xl font-semibold">Payments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Txn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p._id}>
              <TableCell>{p.method}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell className="tabular">{formatNpr(p.amountPaisa)}</TableCell>
              <TableCell className="max-w-[12rem] truncate text-xs">{p.gatewayTxnId || p.pidx}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminSettingsPage() {
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (q.data) setForm(q.data.settings || q.data);
  }, [q.data]);
  const mut = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => toast.success('Settings saved'),
    onError: (e) => toast.error(e.message),
  });
  if (!form) return null;
  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate(form);
      }}
    >
      <Seo title="Settings" noindex />
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted">Payment secrets stay in server environment variables. Only merchant codes and toggles belong here.</p>
      <div>
        <Label htmlFor="storeName">Store name</Label>
        <Input id="storeName" className="mt-1" value={form.storeName || ''} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="email">Contact email</Label>
        <Input id="email" className="mt-1" value={form.contact?.email || ''} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" className="mt-1" value={form.contact?.phone || ''} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" className="mt-1" value={form.contact?.address || ''} onChange={(e) => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} />
      </div>
      <div>
        <Label htmlFor="announce">Announcement</Label>
        <Input
          id="announce"
          className="mt-1"
          value={form.announcementBar?.text || ''}
          onChange={(e) => setForm({ ...form, announcementBar: { ...form.announcementBar, text: e.target.value, enabled: true } })}
        />
      </div>
      <label className="flex items-center justify-between text-sm">
        eSewa enabled
        <Switch
          checked={form.payments?.esewaEnabled !== false}
          onCheckedChange={(v) => setForm({ ...form, payments: { ...form.payments, esewaEnabled: v } })}
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        Khalti enabled
        <Switch
          checked={form.payments?.khaltiEnabled !== false}
          onCheckedChange={(v) => setForm({ ...form, payments: { ...form.payments, khaltiEnabled: v } })}
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        Cash on delivery enabled
        <Switch
          checked={form.payments?.codEnabled !== false}
          onCheckedChange={(v) => setForm({ ...form, payments: { ...form.payments, codEnabled: v } })}
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        Maintenance
        <Switch checked={Boolean(form.maintenanceMode)} onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })} />
      </label>
      <Button type="submit">Save settings</Button>
    </form>
  );
}
