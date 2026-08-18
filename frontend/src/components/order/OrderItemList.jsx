import { Link } from 'react-router-dom';
import { formatNpr } from '@/lib/money';
import { ProductThumb } from '@/components/product/ProductThumb';

function itemHref(item, variant) {
  const productId = item.product?._id || (typeof item.product === 'string' ? item.product : null);
  if (variant === 'admin' && productId) return `/admin/products/${productId}`;
  if (item.slug) return `/product/${item.slug}`;
  return undefined;
}

export function OrderItemList({ items = [], showPrice = true, variant = 'store' }) {
  return (
    <ul className="divide-y divide-border border border-border">
      {items.map((item, i) => {
        const to = itemHref(item, variant);
        return (
          <li key={item.sku || item._id || i} className="flex items-center gap-3 px-4 py-3 text-sm">
            <ProductThumb item={item} size="md" to={to} />
            <span className="min-w-0 flex-1">
              {to ? (
                <Link to={to} className="font-medium hover:text-accent">
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium">{item.name}</span>
              )}
              <span className="text-muted"> × {item.qty}</span>
            </span>
            {showPrice && item.lineTotalPaisa != null ? (
              <span className="tabular">{formatNpr(item.lineTotalPaisa)}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
