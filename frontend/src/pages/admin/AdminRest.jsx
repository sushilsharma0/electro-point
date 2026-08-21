import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Minus, Plus, Copy, Pencil } from 'lucide-react';
import { adminApi, listFrom } from '@/lib/api';
import { formatNpr, nprToPaisa, paisaToNpr } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { OrderProgressBar, OrderStatusBadge, OrderTracker } from '@/components/order/OrderTracker';
import { OrderItemList } from '@/components/order/OrderItemList';
import { ProductNameCell } from '@/components/product/ProductThumb';
import { AdminShipmentForm, ORDER_STATUSES } from '@/components/order/AdminShipmentForm';
import { HeroProductPicker } from '@/components/admin/HeroProductPicker';
import { ShippingMethodsEditor } from '@/components/admin/ShippingMethodsEditor';
import { CountryCodesEditor } from '@/components/admin/CountryCodesEditor';
import { DEFAULT_COUNTRY_CODES } from '@/lib/phone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { variantLabel } from '@/lib/product';
import { formatOrderStamp, paymentLabel } from '@/lib/orderTracking';
import { AdminEmpty, AdminHeader, AdminLoading } from '@/components/admin/AdminChrome';

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  parent: '',
  isActive: true,
  isFeatured: false,
  showOnHomepage: false,
  banner: '',
  image: '',
  description: '',
};

function flattenCategories(nodes, acc = []) {
  for (const node of nodes || []) {
    acc.push(node);
    if (node.children?.length) flattenCategories(node.children, acc);
  }
  return acc;
}

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-categories'], queryFn: () => adminApi.categories() });
  const cats = listFrom(q.data);
  const flat = flattenCategories(cats);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const editing = editingId ? flat.find((c) => String(c._id) === String(editingId)) : null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
    qc.invalidateQueries({ queryKey: ['category'] });
  };

  const create = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_CATEGORY);
      toast.success('Category created');
    },
    onError: (e) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateCategory(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Category saved');
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      invalidate();
      if (editingId) {
        setEditingId(null);
        setForm(EMPTY_CATEGORY);
      }
      toast.success('Category deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  const loadCategory = (node) => {
    setEditingId(node._id);
    setForm({
      name: node.name || '',
      slug: node.slug || '',
      parent: node.parent ? String(node.parent) : '',
      isActive: node.isActive !== false,
      isFeatured: Boolean(node.isFeatured),
      showOnHomepage: Boolean(node.showOnHomepage),
      banner: node.banner || '',
      image: node.image || '',
      description: node.description || '',
    });
  };

  const applyBanner = async (url, { persist = false } = {}) => {
    if (!url) return;
    setForm((cur) => ({ ...cur, banner: url, image: cur.image || url }));
    if (persist && editingId) {
      await adminApi.updateCategory(editingId, { banner: url, image: form.image || url });
      invalidate();
    }
  };

  const uploadBanner = async (file) => {
    try {
      const res = await adminApi.uploadImage(file);
      const url = res.url || res.path || res.file?.url;
      if (!url) throw new Error('Upload did not return a URL');
      await applyBanner(url, { persist: true });
      toast.success(editingId ? 'Banner saved' : 'Banner uploaded — save the category to keep it');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const payload = () => ({
    ...form,
    parent: form.parent || null,
  });

  if (q.isLoading) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Seo title="Categories" noindex />
      <div>
        <h1 className="font-display text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted">Click a category to edit its banner. The storefront category page uses that image.</p>
        <ul className="mt-4 text-sm">
          {cats.map((c) => (
            <CategoryNode
              key={c._id}
              node={c}
              depth={0}
              selectedId={editingId}
              onEdit={loadCategory}
              onDelete={(id) => remove.mutate(id)}
              deletingId={remove.isPending ? remove.variables : null}
            />
          ))}
        </ul>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (editingId) update.mutate({ id: editingId, body: payload() });
          else create.mutate(payload());
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">{editingId ? `Edit ${editing?.name || 'category'}` : 'New category'}</h2>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_CATEGORY);
              }}
            >
              New
            </Button>
          ) : null}
        </div>
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
          <select
            id="cparent"
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3"
            value={form.parent}
            onChange={(e) => setForm({ ...form, parent: e.target.value })}
          >
            <option value="">None</option>
            {flat
              .filter((c) => String(c._id) !== String(editingId))
              .map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="cbanner">Upload image</Label>
          <Input
            id="cbanner"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-1"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadBanner(file);
              e.target.value = '';
            }}
          />
          <Label htmlFor="cbanner-url" className="mt-3 block">
            Or paste image link
          </Label>
          <Input
            id="cbanner-url"
            className="mt-1"
            type="text"
            inputMode="url"
            placeholder="https://example.com/monitors-banner.jpg"
            value={form.banner}
            onChange={(e) => {
              const url = e.target.value;
              setForm({ ...form, banner: url, image: form.image || url });
            }}
          />
          <p className="mt-1 text-xs text-muted">Use a file upload or an https image URL. Save the category to publish it.</p>
          {form.banner ? (
            <div className="relative mt-3 overflow-hidden border border-border product-stage">
              <img src={form.banner} alt="" className="h-28 w-full object-cover" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute right-2 top-2 bg-surface"
                onClick={() => setForm({ ...form, banner: '', image: form.image === form.banner ? '' : form.image })}
              >
                Remove
              </Button>
            </div>
          ) : null}
        </div>
        <div>
          <Label htmlFor="cdesc">Description</Label>
          <Textarea id="cdesc" className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
        <Button type="submit">{editingId ? 'Save category' : 'Create'}</Button>
      </form>
    </div>
  );
}

function CategoryNode({ node, depth, selectedId, onEdit, onDelete, deletingId }) {
  const selected = String(selectedId) === String(node._id);
  return (
    <li className="border-b border-border">
      <div className="flex items-center justify-between gap-3 py-2" style={{ paddingLeft: depth * 16 }}>
        <button
          type="button"
          className={`min-w-0 truncate text-left cursor-pointer ${selected ? 'text-accent' : 'hover:text-accent'}`}
          onClick={() => onEdit(node)}
        >
          {node.name} <span className="text-muted">/{node.slug}</span>
        </button>
        <div className="flex shrink-0 items-center">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${node.name}`} onClick={() => onEdit(node)}>
            <Pencil />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`Delete ${node.name}`}
            disabled={deletingId === node._id}
            onClick={() => onDelete(node._id)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {node.children?.length ? (
        <ul>
          {node.children.map((ch) => (
            <CategoryNode
              key={ch._id}
              node={ch}
              depth={depth + 1}
              selectedId={selectedId}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
            />
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
  if (q.isLoading) return <AdminLoading />;
  return (
    <div className="space-y-6">
      <AdminHeader title="Orders" description="Fulfillment status is written by staff. Payment status comes from the gateway or COD." />
      <select className="h-10 rounded-md border border-border bg-surface px-3" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
      {orders.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o._id}>
                <TableCell>
                  <Link to={`/admin/orders/${o._id}`} className="font-medium hover:text-accent">
                    {o.orderNumber}
                  </Link>
                  {o.email ? <p className="text-xs text-muted">{o.email}</p> : null}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <OrderProgressBar status={o.status} />
                </TableCell>
                <TableCell className="tabular">{formatNpr(o.totalPaisa)}</TableCell>
                <TableCell className="text-sm">{paymentLabel(o)}</TableCell>
                <TableCell className="text-muted">{formatOrderStamp(o.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty title="No orders" body="Checkout will list paid and COD orders here." />
      )}
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['admin-order', id], queryFn: () => adminApi.order(id) });
  const order = q.data?.order || q.data;
  if (q.isLoading || !order) return null;
  const customer = order.user && typeof order.user === 'object' ? order.user : null;
  const address = order.address || {};
  const phone = order.phone || address.phone || customer?.phone || '';
  const email = order.email || customer?.email || '';
  const name = address.fullName || customer?.name || 'Customer';
  const lines = [address.line1, address.line2, [address.city, address.state, address.postalCode].filter(Boolean).join(', '), address.country].filter(Boolean);

  return (
    <div className="space-y-8">
      <Seo title={order.orderNumber} noindex />
      <div>
        <Link to="/admin/orders" className="text-sm text-accent transition-colors duration-200 hover:text-accent-hover">
          All orders
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{order.orderNumber}</h1>
        {order.createdAt ? <p className="mt-1 text-sm text-muted">Placed {formatOrderStamp(order.createdAt)}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-surface p-5">
          <p className="caption">Customer</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminFact label="Name">
              {customer?._id ? (
                <Link to={`/admin/customers/${customer._id}`} className="hover:text-accent">
                  {name}
                </Link>
              ) : (
                name
              )}
            </AdminFact>
            <AdminFact label="Phone">
              {phone ? (
                <span className="flex items-center gap-2">
                  <a href={`tel:${phone}`} className="hover:text-accent">
                    {phone}
                  </a>
                  <CopyButton value={phone} label="Phone" />
                </span>
              ) : (
                '—'
              )}
            </AdminFact>
            <AdminFact label="Email">
              {email ? (
                <span className="flex min-w-0 items-center gap-2">
                  <a href={`mailto:${email}`} className="min-w-0 truncate hover:text-accent">
                    {email}
                  </a>
                  <CopyButton value={email} label="Email" />
                </span>
              ) : (
                '—'
              )}
            </AdminFact>
            <AdminFact label="Account">{customer?.status || 'Guest checkout'}</AdminFact>
          </dl>
        </section>

        <section className="border border-border bg-surface p-5">
          <p className="caption">Delivery</p>
          <address className="mt-4 not-italic text-sm">
            {address.fullName ? <p className="font-medium">{address.fullName}</p> : null}
            {address.phone && address.phone !== phone ? <p className="mt-1">{address.phone}</p> : null}
            {lines.length ? (
              lines.map((line) => (
                <p key={line} className="mt-1 text-muted">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-muted">No address on this order.</p>
            )}
          </address>
          {order.shippingMethod ? (
            <p className="mt-4 text-sm">
              <span className="caption">Method</span>
              <span className="mt-1 block capitalize">{order.shippingMethod.replaceAll('_', ' ')}</span>
            </p>
          ) : null}
        </section>
      </div>

      <OrderTracker order={order} />
      <AdminShipmentForm order={order} />
      <OrderItemList items={order.items || []} variant="admin" />
      <AdminOrderTotals order={order} />
    </div>
  );
}

function AdminFact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="caption">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function CopyButton({ value, label }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-8 w-8 shrink-0"
      aria-label={`Copy ${label.toLowerCase()}`}
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => toast.success(`${label} copied`),
          () => toast.error('Could not copy'),
        );
      }}
    >
      <Copy />
    </Button>
  );
}

function AdminOrderTotals({ order }) {
  const rows = [
    ['Subtotal', order.subtotalPaisa],
    order.discountPaisa ? ['Discount', -order.discountPaisa] : null,
    ['Shipping', order.shippingPaisa || 0],
    order.taxPaisa ? ['Tax', order.taxPaisa] : null,
  ].filter(Boolean);
  return (
    <section className="max-w-sm space-y-2">
      {order.couponCode ? <p className="text-sm text-muted">Coupon {order.couponCode}</p> : null}
      {paymentLabel(order) ? <p className="text-sm text-muted">{paymentLabel(order)}</p> : null}
      {rows.map(([label, paisa]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="tabular">{formatNpr(paisa)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 font-semibold">
        <span>Total</span>
        <span className="tabular">{formatNpr(order.totalPaisa)}</span>
      </div>
    </section>
  );
}

function LegacyCustomersPage() {
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
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-inventory'], queryFn: () => adminApi.inventory({ limit: 50 }) });
  const products = listFrom(q.data);
  const [reason, setReason] = useState('manual');
  const [picked, setPicked] = useState({});
  const mut = useMutation({
    mutationFn: adminApi.adjustInventory,
    onSuccess: () => {
      q.refetch();
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock updated');
    },
    onError: (e) => toast.error(e.message),
  });

  const variantFor = (product) => {
    const variants = product.variants || [];
    if (!variants.length) return null;
    const id = picked[String(product._id)] || String(variants[0]._id);
    return variants.find((v) => String(v._id) === String(id)) || variants[0];
  };

  const adjust = (product, delta) => {
    const variant = variantFor(product);
    mut.mutate({
      productId: product._id,
      variantId: variant?._id || undefined,
      qtyDelta: delta,
      reason: delta > 0 ? 'Increase stock' : 'Decrease stock',
      type: delta > 0 ? (reason === 'restock' ? 'restock' : 'manual') : reason === 'correction' ? 'correction' : 'manual',
    });
  };

  if (q.isLoading) return null;
  return (
    <div>
      <Seo title="Inventory" noindex />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Inventory</h1>
        <div>
          <Label htmlFor="inv-reason">Reason</Label>
          <select
            id="inv-reason"
            className="mt-1 h-10 rounded-md border border-border bg-surface px-3 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="manual">Manual</option>
            <option value="restock">Restock</option>
            <option value="correction">Correction</option>
          </select>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">Pick a variant, then use + and − to change that variant’s stock.</p>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const variants = product.variants || [];
            const variant = variantFor(product);
            const target = variant || product;
            const stock = Number(target.stock || 0);
            const reservedStock = Number(target.reservedStock || 0);
            const available = Math.max(0, stock - reservedStock);
            const busy =
              mut.isPending &&
              String(mut.variables?.productId) === String(product._id) &&
              String(mut.variables?.variantId || '') === String(variant?._id || '');
            const canDecrease = stock - 1 >= reservedStock;
            const label = variant ? variantLabel(variant) || 'Variant' : product.name;
            return (
              <TableRow key={product._id}>
                <TableCell>
                  <ProductNameCell product={product} to={`/admin/products/${product._id}`} />
                </TableCell>
                <TableCell className="min-w-[12rem]">
                  {variants.length ? (
                    <Select
                      value={String(variant._id)}
                      onValueChange={(id) => setPicked((cur) => ({ ...cur, [String(product._id)]: id }))}
                    >
                      <SelectTrigger className="h-9 min-w-[11rem] max-w-[16rem]" aria-label={`Variant for ${product.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map((v) => {
                          const avail = Math.max(0, Number(v.stock || 0) - Number(v.reservedStock || 0));
                          return (
                            <SelectItem key={v._id} value={String(v._id)}>
                              {variantLabel(v) || 'Variant'} · {avail} avail
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Decrease stock for ${label}`}
                      disabled={!canDecrease || mut.isPending}
                      onClick={() => adjust(product, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-10 text-center text-sm tabular">{busy ? '…' : stock}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Increase stock for ${label}`}
                      disabled={mut.isPending}
                      onClick={() => adjust(product, 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="tabular">{reservedStock}</TableCell>
                <TableCell className="tabular">{available}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function LegacyCouponsPage() {
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

function LegacyReviewsPage() {
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
              <TableCell>
                <ProductNameCell product={r.product} name={r.product?.name || r.product} />
              </TableCell>
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

function LegacyPaymentsPage() {
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
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!q.data) return;
    const s = q.data.settings || q.data;
    const shipping = Array.isArray(s.shipping) && s.shipping.length ? s.shipping : [];
    const countryCodes = Array.isArray(s.countryCodes) && s.countryCodes.length ? s.countryCodes : DEFAULT_COUNTRY_CODES;
    setForm({ ...s, shipping, countryCodes });
  }, [q.data]);
  const mut = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: (data) => {
      toast.success('Settings saved');
      if (data) setForm(data.settings || data);
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (!form) return null;
  const heroIds = (
    form.homepage?.heroProductIds?.length
      ? form.homepage.heroProductIds
      : (form.heroProducts || []).map((p) => p._id)
  )
    .map((id) => String(id?._id || id || ''))
    .filter(Boolean);
  const autoplaySec = Math.round((form.homepage?.heroAutoplayMs || 6000) / 1000);
  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const shipping = (form.shipping || []).map((row) => ({
          code: row.code,
          name: row.name,
          pricePaisa: nprToPaisa(row.priceNpr != null ? row.priceNpr : paisaToNpr(row.pricePaisa ?? 0)),
          eta: row.eta || '',
        }));
        const countryCodes = (form.countryCodes || [])
          .map((row) => ({
            dial: String(row.dial || '').replace(/\D/g, '').slice(0, 4),
            label: String(row.label || '').trim(),
            iso: String(row.iso || '').trim().toUpperCase().slice(0, 2),
          }))
          .filter((row) => row.dial && row.label);
        if (!shipping.length) {
          toast.error('Add at least one shipping method');
          return;
        }
        if (!countryCodes.length) {
          toast.error('Add at least one country code');
          return;
        }
        mut.mutate({ ...form, shipping, countryCodes });
      }}
    >
      <Seo title="Settings" noindex />
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted">
        Payment secrets stay in server environment variables. Only merchant codes and toggles belong here. Edit About, Terms, Privacy, FAQ, and Contact copy in{' '}
        <Link to="/admin/pages" className="text-accent hover:underline">
          Pages
        </Link>
        .
      </p>
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
      <HeroProductPicker
        ids={heroIds}
        products={form.heroProducts || []}
        autoplayMs={form.homepage?.heroAutoplayMs || 6000}
        onChange={(heroProductIds, heroProducts) =>
          setForm({
            ...form,
            homepage: { ...form.homepage, heroProductIds },
            heroProducts: heroProducts || form.heroProducts,
          })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="hero-autoplay">Hero autoplay (seconds)</Label>
          <Input
            id="hero-autoplay"
            className="mt-1"
            type="number"
            min={3}
            max={30}
            value={autoplaySec}
            onChange={(e) => {
              const sec = Math.min(30, Math.max(3, Number(e.target.value) || 6));
              setForm({ ...form, homepage: { ...form.homepage, heroAutoplayMs: sec * 1000 } });
            }}
          />
        </div>
        <label className="flex items-end justify-between pb-2 text-sm">
          Show homepage hero
          <Switch
            checked={form.homepage?.hero !== false}
            onCheckedChange={(v) => setForm({ ...form, homepage: { ...form.homepage, hero: v } })}
          />
        </label>
      </div>
      <ShippingMethodsEditor
        value={form.shipping}
        onChange={(shipping) => setForm({ ...form, shipping })}
      />
      <CountryCodesEditor
        value={form.countryCodes}
        onChange={(countryCodes) => setForm({ ...form, countryCodes })}
      />
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
