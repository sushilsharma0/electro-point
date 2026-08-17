import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { checkoutApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { PaymentCancelledPage, PaymentFailedPage } from '@/pages/errors/ErrorPages';
import { formatNpr } from '@/lib/money';

export function EsewaReturnPage() {
  return <PaymentReturnPage gateway="eSewa" />;
}

export function KhaltiReturnPage() {
  return <PaymentReturnPage gateway="Khalti" />;
}

function PaymentReturnPage({ gateway }) {
  const [sp] = useSearchParams();
  const [state, setState] = useState({ status: 'processing', order: null, error: null });

  const orderId = sp.get('orderId') || sp.get('purchase_order_id') || sp.get('oid');
  const qStatus = (sp.get('status') || '').toLowerCase();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (qStatus.includes('cancel')) {
        setState({ status: 'cancelled', order: null, error: null });
        return;
      }
      if (!orderId) {
        setState({ status: 'unknown', order: null, error: 'Missing order reference. Check your account orders.' });
        return;
      }
      try {
        const data = await checkoutApi.order(orderId);
        const order = data.order || data;
        const pay = (order.payment?.status || order.status || '').toLowerCase();
        if (cancelled) return;
        if (['paid', 'confirmed', 'processing', 'completed'].includes(pay) || order.status === 'paid') {
          setState({ status: 'paid', order, error: null });
        } else if (['payment_failed', 'failed'].includes(pay) || order.status === 'payment_failed') {
          setState({ status: 'failed', order, error: null });
        } else if (['cancelled', 'canceled'].includes(pay)) {
          setState({ status: 'cancelled', order, error: null });
        } else {
          setTimeout(run, 2000);
        }
      } catch (err) {
        if (!cancelled) setState({ status: 'error', order: null, error: err.message });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, qStatus]);

  if (state.status === 'failed') return <PaymentFailedPage />;
  if (state.status === 'cancelled') return <PaymentCancelledPage />;

  return (
    <Container className="max-w-lg py-16 text-center">
      <Seo title={`${gateway} payment`} noindex />
      {state.status === 'processing' ? (
        <>
          <h1 className="font-display text-h2">Confirming payment</h1>
          <p className="mt-3 text-sm text-muted">
            Waiting for {gateway} verification from the server. Do not trust this page until the order shows paid.
          </p>
        </>
      ) : null}
      {state.status === 'paid' ? (
        <>
          <h1 className="font-display text-h2">Payment received</h1>
          <p className="mt-3 text-sm text-muted">
            Order {state.order.orderNumber} · {formatNpr(state.order.totalPaisa)}
          </p>
          <Button asChild className="mt-8">
            <Link to={`/account/orders/${state.order._id || state.order.id}`}>View order</Link>
          </Button>
        </>
      ) : null}
      {state.status === 'unknown' || state.status === 'error' ? (
        <>
          <h1 className="font-display text-h2">Check your orders</h1>
          <p role="alert" className="mt-3 text-sm text-muted">{state.error}</p>
          <Button asChild className="mt-8">
            <Link to="/account/orders">Orders</Link>
          </Button>
        </>
      ) : null}
    </Container>
  );
}
