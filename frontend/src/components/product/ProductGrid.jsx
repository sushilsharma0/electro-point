import { useState } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { QuickView } from '@/components/product/QuickView';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/pages/errors/EmptyState';

export function ProductGrid({ products, isLoading, emptyTitle = 'No products', emptyBody }) {
  const [quick, setQuick] = useState(null);
  if (isLoading) return <ProductGridSkeleton />;
  if (!products?.length) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {products.map((p) => (
          <ProductCard key={p._id || p.slug} product={p} onQuickView={setQuick} />
        ))}
      </div>
      <QuickView product={quick} open={Boolean(quick)} onOpenChange={(o) => !o && setQuick(null)} />
    </>
  );
}
