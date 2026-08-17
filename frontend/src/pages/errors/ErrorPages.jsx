import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Page not found" noindex />
      <p className="caption">404</p>
      <h1 className="mt-2 font-display text-h1">This page does not exist</h1>
      <p className="mt-3 text-muted">The product or category may have moved. Try search or return to the store.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/shop">Shop</Link>
        </Button>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Something went wrong" noindex />
      <p className="caption">500</p>
      <h1 className="mt-2 font-display text-h1">We could not load this</h1>
      <p className="mt-3 text-muted">A server error occurred. Retry in a moment. Your cart is saved.</p>
      <Button asChild className="mt-8">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Sign in required" noindex />
      <h1 className="font-display text-h1">Sign in to continue</h1>
      <p className="mt-3 text-muted">This area is for signed-in customers. You can still browse the catalog as a guest.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/shop">Keep browsing</Link>
        </Button>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Access denied" noindex />
      <h1 className="font-display text-h1">You do not have access</h1>
      <p className="mt-3 text-muted">Admin tools are limited to the store superadmin.</p>
      <Button asChild className="mt-8">
        <Link to="/">Return to store</Link>
      </Button>
    </div>
  );
}

export function NetworkErrorPage({ onRetry }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Network error" noindex />
      <h1 className="font-display text-h1">Connection lost</h1>
      <p className="mt-3 text-muted">Check your network and try again. We did not charge your account.</p>
      <div className="mt-8 flex justify-center gap-3">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

export function PaymentFailedPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Payment failed" noindex />
      <h1 className="font-display text-h1">Payment was not completed</h1>
      <p className="mt-3 text-muted">The gateway reported a failure. No charge was captured. You can retry from your orders.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/account/orders">View orders</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/cart">Return to cart</Link>
        </Button>
      </div>
    </div>
  );
}

export function PaymentCancelledPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Seo title="Payment cancelled" noindex />
      <h1 className="font-display text-h1">Payment cancelled</h1>
      <p className="mt-3 text-muted">You left the payment page. The order is unpaid. Stock is held only while the order is pending.</p>
      <Button asChild className="mt-8">
        <Link to="/account/orders">Resume from orders</Link>
      </Button>
    </div>
  );
}
