import { Link } from 'react-router-dom';
import { productImage } from '@/lib/product';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-16 w-16',
};

export function ProductThumb({ product, item, alt = '', size = 'md', to, className }) {
  const srcDoc = product || item || {};
  const box = (
    <span className={cn('product-stage inline-flex shrink-0 overflow-hidden', SIZES[size] || size, className)}>
      <img src={productImage(srcDoc)} alt={alt} className="h-full w-full object-contain p-1" />
    </span>
  );
  if (to) {
    return (
      <Link to={to} className="shrink-0">
        {box}
      </Link>
    );
  }
  return box;
}

export function ProductNameCell({ product, item, name, to, className }) {
  const p = product || item || {};
  const label = name || p.name || '';
  const href =
    to ||
    (p._id || p.productId ? `/admin/products/${p._id || p.productId}` : p.slug ? `/product/${p.slug}` : undefined);
  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <ProductThumb product={p} item={item} size="sm" />
      {href ? (
        <Link to={href} className="min-w-0 truncate hover:text-accent">
          {label}
        </Link>
      ) : (
        <span className="min-w-0 truncate">{label}</span>
      )}
    </span>
  );
}
