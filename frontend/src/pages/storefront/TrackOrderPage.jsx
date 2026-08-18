import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { PackageSearch } from 'lucide-react';
import { checkoutApi } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { Container } from '@/components/layout/Container';
import { OrderTracker } from '@/components/order/OrderTracker';
import { Seo } from '@/components/Seo';

export function TrackOrderPage() {
  const [sp] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(sp.get('order') || '');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  const lookUp = useMutation({
    mutationFn: (body) => checkoutApi.trackOrder(body),
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  const heading = useMemo(() => (result ? result.orderNumber : 'Track an order'), [result]);

  return (
    <Container className="max-w-3xl py-16">
      <Seo title="Track order" canonical="/track" />
      <p className="caption">Shipments</p>
      <h1 className="mt-2 font-display text-h1">{heading}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Enter the order number from your confirmation email and the same email used at checkout. Signed-in customers can also open{' '}
        <Link to="/account/orders" className="text-accent hover:underline">
          account orders
        </Link>
        .
      </p>

      <form
        className="mt-8 grid gap-4 border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          lookUp.mutate({ orderNumber: orderNumber.trim(), email: email.trim() });
        }}
      >
        <div>
          <Label htmlFor="track-order-number">Order number</Label>
          <Input
            id="track-order-number"
            className="mt-1 font-spec"
            autoComplete="off"
            placeholder="EP-20260818-1234"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="track-email">Email</Label>
          <Input
            id="track-email"
            type="email"
            className="mt-1"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="sm:mb-px" disabled={lookUp.isPending}>
          {lookUp.isPending ? 'Looking up' : 'Track'}
        </Button>
        {lookUp.isError ? (
          <div className="sm:col-span-3">
            <FieldError>{lookUp.error?.message || 'Order not found'}</FieldError>
          </div>
        ) : null}
      </form>

      {result ? (
        <div className="mt-10 space-y-8">
          <OrderTracker order={result} />
          <ul className="divide-y divide-border border border-border">
            {(result.items || []).map((item, i) => (
              <li key={`${item.sku}-${i}`} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {item.name} × {item.qty}
                </span>
              </li>
            ))}
          </ul>
          {result.totalPaisa != null ? (
            <p className="font-semibold">Total {formatNpr(result.totalPaisa)}</p>
          ) : null}
        </div>
      ) : lookUp.isIdle ? (
        <div className="mt-16 text-center text-muted">
          <PackageSearch className="mx-auto h-8 w-8" aria-hidden />
          <p className="mt-3 text-sm">No lookup yet. Tracking appears here after a match.</p>
        </div>
      ) : null}
    </Container>
  );
}
