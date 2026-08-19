import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatNpr } from '@/lib/money';
import { productImage, variantLabel, availableStock } from '@/lib/product';

export function CartItem({ item, onQty, onRemove, compact = false }) {
  const product = item.product || item;
  const line = item.lineTotalPaisa ?? item.priceSnapshotPaisa * item.qty;
  const err = item.error || item.stockError;
  const thumb = compact ? 'h-16 w-16' : 'h-24 w-24';
  const maxQty = Number(item.available ?? availableStock(item.variant || product) || item.qty || 1);

  return (
    <article className="flex gap-4 border-b border-border py-4">
      <Link to={`/product/${product.slug}`} className={`${thumb} shrink-0 product-stage`}>
        <img src={productImage(product)} alt={product.name} className="h-full w-full object-contain p-2" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="caption">{product.brand}</p>
        <Link to={`/product/${product.slug}`} className="font-medium hover:text-accent">
          {product.name}
        </Link>
        {item.variant || item.options ? (
          <p className="text-sm text-muted">{variantLabel(item.variant || { options: item.options })}</p>
        ) : null}
        {err ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {err}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex items-center border border-border">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Decrease quantity" onClick={() => onQty(Math.max(1, item.qty - 1))}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-8 text-center text-sm tabular">{item.qty}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Increase quantity" disabled={item.qty >= maxQty} onClick={() => onQty(Math.min(maxQty, item.qty + 1))}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="price-display text-base">{formatNpr(line)}</p>
    </article>
  );
}
