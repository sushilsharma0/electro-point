import { useQuery } from '@tanstack/react-query';
import { catalogApi, listFrom } from '@/lib/api';
import { getRecentlyViewed } from '@/lib/storage';
import { idOf } from '@/lib/product';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeleton';

export function RecentlyViewed({ excludeId, className }) {
  const ids = getRecentlyViewed().filter((id) => String(id) !== String(excludeId));
  const q = useQuery({
    queryKey: ['recently-viewed', ids],
    queryFn: () => catalogApi.compare(ids),
    enabled: ids.length > 0,
  });
  const products = listFrom(q.data?.products || q.data);
  if (!ids.length) return null;
  if (q.isLoading) {
    return (
      <section className={className} aria-busy="true">
        <h2 className="font-display text-h3">Recently viewed</h2>
        <div className="mt-6">
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }
  if (!products.length) return null;
  return (
    <section className={className}>
      <h2 className="font-display text-h3">Recently viewed</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={idOf(p)} product={p} />
        ))}
      </div>
    </section>
  );
}
