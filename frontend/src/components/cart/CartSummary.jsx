import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNpr } from '@/lib/money';
import { useCart } from '@/hooks/useCart';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductThumb } from '@/components/product/ProductThumb';

export function CartSummary({ cart, quote, quoteLoading = false, cta, ctaLabel = 'Checkout' }) {
  const totals = quote || cart || {};
  const { applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const applied = cart?.couponCode || totals.couponCode;
  const items = cart?.items || [];

  if (quoteLoading) {
    return (
      <aside className="h-fit space-y-3 border border-border bg-surface p-6" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </aside>
    );
  }

  return (
    <aside className="h-fit border border-border bg-surface p-6">
      <p className="caption">Your order</p>
      <h2 className="mt-1 font-display text-lg font-semibold">Order summary</h2>
      {items.length ? (
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {items.map((item) => {
            const line = item.lineTotalPaisa ?? (item.priceSnapshotPaisa || 0) * (item.qty || 1);
            return (
              <li key={item.id || item._id} className="flex items-center gap-3 py-3 text-sm">
                <ProductThumb item={item} size="sm" to={item.slug ? `/product/${item.slug}` : undefined} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="text-muted">Qty {item.qty}</span>
                </span>
                <span className="shrink-0 tabular text-muted">{formatNpr(line)}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular">{formatNpr(totals.subtotalPaisa ?? 0)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Discount</dt>
          <dd className="tabular">{formatNpr(-(totals.discountPaisa ?? 0))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className="tabular">{formatNpr(totals.shippingPaisa ?? 0)}</dd>
        </div>
        {totals.taxPaisa ? (
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd className="tabular">{formatNpr(totals.taxPaisa)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="price-display text-xl">{formatNpr(totals.totalPaisa ?? totals.subtotalPaisa ?? 0)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-muted">Quoted in NPR. Recalculated when you place the order.</p>
      <form
        className="mt-5 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) applyCoupon.mutate(code.trim());
        }}
      >
        <Label htmlFor="coupon">Coupon</Label>
        {applied ? (
          <div className="flex items-center justify-between border border-border bg-muted-bg px-3 py-2 text-sm">
            <span className="font-medium">{applied}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeCoupon.mutate()}>
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" />
            <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
              Apply
            </Button>
          </div>
        )}
      </form>
      {cta}
      {!cta && ctaLabel ? null : null}
    </aside>
  );
}
