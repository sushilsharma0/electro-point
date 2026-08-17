import { useState } from 'react';
import { cn } from '@/lib/cn';
import { productImage } from '@/lib/product';

export function ProductGallery({ product, visualSlot }) {
  const images = (product.images || []).map((i) => i.url || i).filter(Boolean);
  if (!images.length) images.push(productImage(product));
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square product-stage overflow-hidden rounded-sm">
        <img src={images[active]} alt={`${product.name} image ${active + 1}`} className="h-full w-full object-contain p-6" />
        {visualSlot}
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'h-16 w-16 cursor-pointer overflow-hidden rounded-sm border product-stage',
                  i === active ? 'border-accent' : 'border-border',
                )}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active}
              >
                <img src={src} alt="" className="h-full w-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
