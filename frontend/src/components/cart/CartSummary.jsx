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

  if (quoteLoading) {
    return (
      <aside className="h-fit space-y-3 border border-border bg-surface p-5" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </aside>
    );
  }

  return (
    <aside className="h-fit border border-border bg-surface p-5">
      <h2 className="font-display text-base font-semibold">Order summary</h2>
      {(cart?.items || []).length ? (
        <ul className="mt-4 space-y-3">
          {(cart.items || []).map((item) => (
            <li key={item.id || item._id} className="flex items-center gap-3 text-sm">
              <ProductThumb item={item} size="sm" to={item.slug ? `/product/${item.slug}` : undefined} />
              <span className="min-w-0 flex-1 truncate">
                {item.name} × {item.qty}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="mt-4 space-y-2 text-sm">
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
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <dt>Total</dt>
          <dd className="price-display text-lg">{formatNpr(totals.totalPaisa ?? totals.subtotalPaisa ?? 0)}</dd>
        </div>
      </dl>
      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) applyCoupon.mutate(code.trim());
        }}
      >
        <Label htmlFor="coupon">Coupon</Label>
        {applied ? (
          <div className="flex items-center justify-between text-sm">
            <span>{applied}</span>
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
