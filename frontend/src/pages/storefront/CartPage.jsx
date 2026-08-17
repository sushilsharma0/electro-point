import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useQuote } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { EmptyState } from '@/pages/errors/EmptyState';

export function CartPage() {
  const { cart, items, query, updateItem, removeItem } = useCart();
  const quote = useQuote({});

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <CartSkeleton />
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container className="py-10">
        <Seo title="Cart" canonical="/cart" noindex />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          body="Browse the catalog. Guest carts persist in a signed cookie until you sign in."
          actionTo="/shop"
          actionLabel="Shop devices"
        />
      </Container>
    );
  }

  const totals = quote.data || cart;

  return (
    <Container className="py-10">
      <Seo title="Cart" canonical="/cart" noindex />
      <h1 className="font-display text-h1">Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {items.map((item) => (
            <CartItem
              key={item._id || item.id}
              item={item}
              onQty={(qty) => updateItem.mutate({ itemId: item._id || item.id, qty })}
              onRemove={() => removeItem.mutate(item._id || item.id)}
            />
          ))}
        </div>
        <CartSummary
          cart={cart}
          quote={totals}
          quoteLoading={quote.isLoading}
          cta={
            <Button asChild className="mt-6 w-full" size="lg">
              <Link to="/checkout">Checkout</Link>
            </Button>
          }
        />
      </div>
    </Container>
  );
}
