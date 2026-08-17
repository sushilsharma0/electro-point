import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { RatingStars } from '@/components/product/RatingStars';
import { StockStatus } from '@/components/product/StockStatus';
import { productImage } from '@/lib/product';
import { useCart } from '@/hooks/useCart';
import { idOf } from '@/lib/product';

export function QuickView({ product, open, onOpenChange }) {
  const { add } = useCart();
  if (!product) return null;
  const id = idOf(product);
  const variantId = product.variants?.[0]?._id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="aspect-square product-stage">
            <img src={productImage(product)} alt={product.name} className="h-full w-full object-contain p-4" />
          </div>
          <div>
            <p className="caption">{product.brand}</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{product.name}</h2>
            <RatingStars value={product.ratingAvg} count={product.ratingCount} />
            <PriceDisplay className="mt-3" pricePaisa={product.pricePaisa} salePricePaisa={product.salePricePaisa} />
            <StockStatus className="mt-2" item={product} />
            <p className="mt-3 line-clamp-4 text-sm text-muted">{product.shortDescription}</p>
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                onClick={() => add.mutate({ productId: id, variantId, qty: 1 })}
              >
                Add to cart
              </Button>
              <Button asChild variant="outline">
                <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)}>
                  Full details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
