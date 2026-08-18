import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, Heart, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { RatingStars } from '@/components/product/RatingStars';
import { StockStatus } from '@/components/product/StockStatus';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { idOf, productBadge, productHoverImage, productImage, availableStock } from '@/lib/product';
import { cn } from '@/lib/cn';
import { WithTooltip } from '@/components/ui/tooltip';

export function ProductCard({ product, onQuickView }) {
  const [hover, setHover] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const nav = useNavigate();
  const id = idOf(product);
  const wished = ids.has(String(id));
  const badge = productBadge(product);
  const main = productImage(product);
  const second = productHoverImage(product);
  const inStock = availableStock(product) > 0;
  const variantId = product.variants?.[0]?._id || product.variants?.[0]?.id;

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add.mutate(
      { productId: id, variantId, qty: 1 },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        },
      },
    );
  };

  return (
    <article
      className="group flex flex-col border border-border bg-surface transition-colors duration-200 hover:border-foreground/25"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={`/product/${product.slug}`} className="relative block product-stage aspect-square overflow-hidden">
        <img
          src={main}
          alt={product.name}
          className={cn('absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-200', hover && second ? 'opacity-0' : 'opacity-100')}
        />
        {second ? (
          <img
            src={second}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-200', hover ? 'opacity-100' : 'opacity-0')}
          />
        ) : null}
        {badge ? (
          <Badge tone={badge.tone} className="absolute left-2 top-2">
            {badge.label}
          </Badge>
        ) : null}
        <WithTooltip label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
          <button
            type="button"
            className={cn('absolute right-2 top-2 rounded-md p-2 cursor-pointer transition-colors duration-200', wished ? 'text-danger' : 'text-muted hover:text-foreground')}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(id);
            }}
          >
            <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
          </button>
        </WithTooltip>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="caption">{product.brand}</p>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.6em] text-sm font-medium leading-snug hover:text-accent">
          {product.name}
        </Link>
        <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        <PriceDisplay pricePaisa={product.pricePaisa} salePricePaisa={product.salePricePaisa} size="sm" />
        <StockStatus item={product} className="text-xs" />
        <div className="mt-auto flex gap-2 pt-2 opacity-100 md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
          <Button type="button" size="sm" className="flex-1" disabled={!inStock || add.isPending} onClick={addToCart}>
            {added ? (
              <WithTooltip label="Added">
                <Check />
              </WithTooltip>
            ) : (
              <WithTooltip label="Add to cart">
                <ShoppingBag />
              </WithTooltip>
            )}
            {added ? 'Added' : 'Add'}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label="Quick view"
            onClick={(e) => {
              e.preventDefault();
              if (onQuickView) onQuickView(product);
              else nav(`/product/${product.slug}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
