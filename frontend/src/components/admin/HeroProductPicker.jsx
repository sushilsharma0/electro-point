import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, listFrom } from '@/lib/api';
import { useDebounce } from '@/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductNameCell } from '@/components/product/ProductThumb';

const MAX_HERO = 8;

export function HeroProductPicker({ ids = [], onChange }) {
  const [q, setQ] = useState('');
  const term = useDebounce(q, 250);
  const selectedIds = ids.map(String);

  const selectedQuery = useQuery({
    queryKey: ['admin-hero-selected', selectedIds],
    queryFn: async () => {
      const rows = await Promise.all(selectedIds.map((id) => adminApi.product(id).catch(() => null)));
      return selectedIds
        .map((id, i) => {
          const row = rows[i];
          const product = row?.product || row;
          if (product && (product._id || product.name)) return product;
          return { _id: id, name: 'Unavailable product' };
        });
    },
    enabled: selectedIds.length > 0,
  });

  const searchQuery = useQuery({
    queryKey: ['admin-products', 'hero-picker', term],
    queryFn: () => adminApi.products({ limit: 20, q: term || undefined, status: 'published' }),
  });

  const selected =
    selectedQuery.data || selectedIds.map((id) => ({ _id: id, name: 'Loading…' }));
  const matches = useMemo(() => {
    const taken = new Set(selectedIds);
    return listFrom(searchQuery.data).filter((p) => p && !taken.has(String(p._id)));
  }, [searchQuery.data, selectedIds]);

  const move = (index, dir) => {
    const next = [...selectedIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4 border border-border p-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Homepage hero carousel</h2>
        <p className="mt-1 text-sm text-muted">
          Pick up to {MAX_HERO} published products. They rotate in this order on the storefront hero.
        </p>
      </div>
      {selectedIds.length ? (
        <ul className="divide-y divide-border border border-border">
          {selected.map((p, i) => (
            <li key={String(p._id)} className="flex items-center gap-2 px-3 py-2">
              <span className="w-5 text-xs tabular-nums text-muted">{i + 1}</span>
              <ProductNameCell product={p} to={`/admin/products/${p._id}`} className="min-w-0 flex-1" />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Move down"
                disabled={i === selectedIds.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(selectedIds.filter((id) => id !== String(p._id)))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No products selected. Featured catalog items are used until you add slides.</p>
      )}
      {selectedIds.length < MAX_HERO ? (
        <div>
          <Label htmlFor="hero-search">Add a product</Label>
          <Input
            id="hero-search"
            className="mt-1"
            placeholder="Search name, brand, SKU"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          />
          <ul className="mt-2 max-h-56 overflow-y-auto border border-border">
            {matches.slice(0, 12).map((p) => (
              <li key={p._id} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
                <ProductNameCell product={p} to={`/admin/products/${p._id}`} className="min-w-0 flex-1" />
                <Button type="button" size="sm" variant="outline" onClick={() => onChange([...selectedIds, String(p._id)])}>
                  <Plus />
                  Add
                </Button>
              </li>
            ))}
            {!matches.length ? (
              <li className="px-3 py-3 text-sm text-muted">
                {searchQuery.isLoading ? 'Loading products…' : 'No matching published products.'}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
