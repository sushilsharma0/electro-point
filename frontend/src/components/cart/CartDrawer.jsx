import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/components/cart/CartItem';
import { useCart } from '@/hooks/useCart';
import { useCartUi } from '@/store/cart';
import { formatNpr } from '@/lib/money';
import { CartDrawerSkeleton } from '@/components/ui/skeleton';
import { WithTooltip } from '@/components/ui/tooltip';

export function CartDrawer() {
  const { pathname } = useLocation();
  const { cart, items, updateItem, removeItem, query } = useCart();
  const drawerOpen = useCartUi((s) => s.drawerOpen);
  const closeDrawer = useCartUi((s) => s.closeDrawer);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  const subtotal = cart?.subtotalPaisa ?? items.reduce((sum, item) => {
    const line = item.lineTotalPaisa ?? (item.priceSnapshotPaisa || 0) * item.qty;
    return sum + Number(line || 0);
  }, 0);

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        id="cart-drawer"
        side="right"
        title="Cart"
        className="flex w-full max-w-md flex-col p-0"
      >
        <div className="border-b border-border px-6 py-4 pr-12">
          <h2 className="font-display text-lg font-semibold">Cart</h2>
          <p className="text-sm text-muted">
            {items.length ? `${items.length} ${items.length === 1 ? 'item' : 'items'}` : 'No items yet'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {query.isLoading ? (
            <CartDrawerSkeleton />
          ) : !items.length ? (
            <div className="flex flex-col items-center py-16 text-center">
              <WithTooltip label="Empty cart">
                <ShoppingBag className="h-8 w-8 text-muted" />
              </WithTooltip>
              <p className="mt-3 text-sm text-muted">Your cart is empty.</p>
              <Button asChild variant="outline" className="mt-4" onClick={closeDrawer}>
                <Link to="/shop">Shop devices</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item._id || item.id}
                compact
                item={item}
                onQty={(qty) => updateItem.mutate({ itemId: item._id || item.id, qty })}
                onRemove={() => removeItem.mutate(item._id || item.id)}
              />
            ))
          )}
        </div>

        {items.length ? (
          <div className="mt-auto space-y-3 border-t border-border px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="price-display text-base">{formatNpr(subtotal)}</span>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link to="/checkout">Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/cart">View cart</Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
