import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { accountApi, checkoutApi, listFrom } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { idOf } from '@/lib/product';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductCard } from '@/components/product/ProductCard';
import { EmptyState } from '@/pages/errors/EmptyState';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

export function AccountHomePage() {
  const { user } = useAuth();
  return (
    <div>
      <Seo title="Account" noindex />
      <p className="text-muted">Signed in as {user?.email}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link className="border border-border p-4 hover:border-foreground/30" to="/account/orders">
          Orders
        </Link>
        <Link className="border border-border p-4 hover:border-foreground/30" to="/account/wishlist">
          Wishlist
        </Link>
        <Link className="border border-border p-4 hover:border-foreground/30" to="/account/addresses">
          Addresses
        </Link>
        <Link className="border border-border p-4 hover:border-foreground/30" to="/account/profile">
          Profile
        </Link>
      </div>
    </div>
  );
}

export function AccountOrdersPage() {
  const q = useQuery({ queryKey: ['my-orders'], queryFn: () => checkoutApi.myOrders() });
  const orders = listFrom(q.data);
  if (!q.isLoading && !orders.length) {
    return <EmptyState title="No orders yet" body="When you complete checkout, they appear here." actionTo="/shop" actionLabel="Shop" />;
  }
  return (
    <div>
      <Seo title="Orders" noindex />
      <ul className="divide-y divide-border border border-border">
        {orders.map((o) => (
          <li key={o._id}>
            <Link to={`/account/orders/${o._id}`} className="flex items-center justify-between p-4 hover:bg-muted-bg">
              <span>
                <span className="block font-medium">{o.orderNumber}</span>
                <span className="text-sm text-muted">{o.status}</span>
              </span>
              <span className="tabular">{formatNpr(o.totalPaisa)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountOrderDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['order', id], queryFn: () => checkoutApi.order(id) });
  const order = q.data?.order || q.data;
  if (!order) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div>
      <Seo title={`Order ${order.orderNumber}`} noindex />
      <h2 className="font-display text-xl font-semibold">{order.orderNumber}</h2>
      <p className="mt-1 text-sm text-muted">
        {order.status}
        {order.payment?.method === 'cod'
          ? ` · Cash on delivery (${order.payment?.status || 'pending'})`
          : order.payment?.method
            ? ` · ${order.payment.method}`
            : ''}
      </p>
      <ul className="mt-6 divide-y divide-border">
        {(order.items || []).map((item, i) => (
          <li key={i} className="flex justify-between py-3 text-sm">
            <span>
              {item.name} × {item.qty}
            </span>
            <span className="tabular">{formatNpr(item.lineTotalPaisa)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-semibold">Total {formatNpr(order.totalPaisa)}</p>
      {order.timeline?.length ? (
        <ol className="mt-8 space-y-2 text-sm">
          {order.timeline.map((t, i) => (
            <li key={i}>
              <span className="font-medium">{t.status}</span>{' '}
              <span className="text-muted">{t.at ? new Date(t.at).toLocaleString() : ''}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function AccountProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const form = useForm({ defaultValues: { name: user?.name || '', phone: user?.phone || '' } });
  const mut = useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form className="max-w-md space-y-4" onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
      <Seo title="Profile" noindex />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" className="mt-1" {...form.register('name')} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" className="mt-1" {...form.register('phone')} />
      </div>
      <p className="text-sm text-muted">{user?.email}</p>
      <Button type="submit">Save</Button>
    </form>
  );
}

export function AccountAddressesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['addresses'], queryFn: accountApi.addresses });
  const addresses = listFrom(q.data);
  const form = useForm({
    defaultValues: { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'Nepal' },
  });
  const create = useMutation({
    mutationFn: accountApi.createAddress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      form.reset();
      toast.success('Address saved');
    },
  });
  const del = useMutation({
    mutationFn: accountApi.deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Seo title="Addresses" noindex />
      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a._id} className="border border-border p-4 text-sm">
            <p className="font-medium">{a.fullName}</p>
            <p className="text-muted">
              {a.line1}, {a.city}
            </p>
            <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => del.mutate(a._id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <form className="space-y-3" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
        <h3 className="font-display font-semibold">Add address</h3>
        {['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'].map((f) => (
          <div key={f}>
            <Label htmlFor={f} className="capitalize">
              {f}
            </Label>
            <Input id={f} className="mt-1" {...form.register(f, { required: true })} />
          </div>
        ))}
        <Button type="submit">Save address</Button>
      </form>
    </div>
  );
}

export function AccountWishlistPage() {
  const { products, query } = useWishlist();
  const { add } = useCart();
  if (!query.isLoading && !products.length) {
    return <EmptyState icon={Heart} title="Wishlist is empty" body="Save devices while you decide." actionTo="/shop" actionLabel="Browse" />;
  }
  const list = products.map((p) => p.product || p);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Seo title="Wishlist" noindex />
      {list.map((p) => (
        <div key={idOf(p)}>
          <ProductCard product={p} />
          <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => add.mutate({ productId: idOf(p), qty: 1 })}>
            Move to cart
          </Button>
        </div>
      ))}
    </div>
  );
}

export function AccountReviewsPage() {
  const q = useQuery({ queryKey: ['my-reviews'], queryFn: accountApi.reviews });
  const reviews = listFrom(q.data);
  if (!q.isLoading && !reviews.length) {
    return <EmptyState title="No reviews yet" body="Reviews require a verified purchase." />;
  }
  return (
    <ul className="space-y-4">
      <Seo title="Your reviews" noindex />
      {reviews.map((r) => (
        <li key={r._id} className="border-b border-border pb-4">
          <p className="font-medium">{r.title}</p>
          <p className="text-sm text-muted">{r.body}</p>
          <p className="mt-1 text-xs text-muted">{r.status}</p>
        </li>
      ))}
    </ul>
  );
}
