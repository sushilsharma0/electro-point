import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNpr } from '@/lib/money';
import { useCart } from '@/hooks/useCart';

export function CartSummary({ cart, quote, cta, ctaLabel = 'Checkout' }) {
  const totals = quote || cart || {};
  const { applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const applied = cart?.couponCode || totals.couponCode;

  return (
    <aside className="h-fit border border-border bg-surface p-5">
      <h2 className="font-display text-base font-semibold">Order summary</h2>
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
