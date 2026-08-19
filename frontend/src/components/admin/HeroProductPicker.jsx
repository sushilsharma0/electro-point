import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, listFrom } from '@/lib/api';
import { useDebounce } from '@/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductNameCell } from '@/components/product/ProductThumb';
import { idOf, productImage } from '@/lib/product';
import { cn } from '@/lib/cn';

const MAX_HERO = 8;

function asId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  const id = idOf(value) || value._id || value.id;
  return id ? String(id) : '';
}

export function HeroProductPicker({ ids = [], products: savedProducts = [], autoplayMs = 6000, onChange }) {
  const [q, setQ] = useState('');
  const [cache, setCache] = useState({});
  const term = useDebounce(q, 250);

  const selectedIds = useMemo(() => {
    const fromIds = (ids || []).map(asId).filter(Boolean);
    if (fromIds.length) return [...new Set(fromIds)];
    return [...new Set((savedProducts || []).map((p) => asId(p)).filter(Boolean))];
  }, [ids, savedProducts]);

  useEffect(() => {
    setCache((cur) => {
      const next = { ...cur };
      for (const p of savedProducts) {
        const id = asId(p);
        if (id) next[id] = p;
      }
      return next;
    });
  }, [savedProducts]);

  const selectedQuery = useQuery({
    queryKey: ['admin-hero-selected', selectedIds],
    queryFn: async () => {
      const rows = await Promise.all(selectedIds.map((id) => adminApi.product(id).catch(() => null)));
      return selectedIds.map((id, i) => {
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

  useEffect(() => {
    if (!selectedQuery.data) return;
    setCache((cur) => {
      const next = { ...cur };
      for (const p of selectedQuery.data) {
        const id = asId(p);
        if (id) next[id] = p;
      }
      return next;
    });
  }, [selectedQuery.data]);

  const matches = useMemo(() => {
    const taken = new Set(selectedIds);
    return listFrom(searchQuery.data).filter((p) => p && !taken.has(asId(p)));
  }, [searchQuery.data, selectedIds]);

  const selected = selectedIds.map((id) => cache[id] || { _id: id, name: 'Loading…' });

  const remember = (product) => {
    const id = asId(product);
    if (id) setCache((cur) => ({ ...cur, [id]: product }));
  };

  const emit = (nextIds, extra) => {
    if (extra) remember(extra);
    const unique = [...new Set(nextIds.map(asId).filter(Boolean))].slice(0, MAX_HERO);
    const products = unique.map((id) => {
      if (extra && asId(extra) === id) return extra;
      return cache[id] || savedProducts.find((p) => asId(p) === id) || { _id: id };
    });
    onChange(unique, products);
  };

  const remove = (productId) => emit(selectedIds.filter((id) => id !== asId(productId)));

  const move = (index, dir) => {
    const next = [...selectedIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  return (
    <div className="space-y-4 border border-border p-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Homepage hero carousel</h2>
        <p className="mt-1 text-sm text-muted">
          Pick up to {MAX_HERO} published products. They rotate in this order on the storefront hero.
        </p>
      </div>

      <div>
        <Label>Added products</Label>
        {selectedIds.length ? (
          <div className="mt-2 space-y-3">
            <PickerCarousel products={selected} autoplayMs={autoplayMs} onRemove={remove} />
            <ul className="divide-y divide-border border border-border">
              {selected.map((p, i) => (
                <li key={asId(p) || i} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-5 text-xs tabular-nums text-muted">{i + 1}</span>
                  <ProductNameCell product={p} to={`/admin/products/${asId(p)}`} className="min-w-0 flex-1" />
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
                  <Button type="button" size="sm" variant="outline" onClick={() => remove(p)}>
                    <X />
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No products selected. Featured catalog items are used until you add slides.
          </p>
        )}
      </div>

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
              <li key={asId(p)} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
                <ProductNameCell product={p} to={`/admin/products/${asId(p)}`} className="min-w-0 flex-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => emit([...selectedIds, asId(p)], p)}
                >
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

function PickerCarousel({ products = [], autoplayMs = 6000, onRemove }) {
  const slides = products.filter(Boolean);
  const [index, setIndex] = useState(0);
  const product = slides[index] || slides[0];
  const many = slides.length > 1;
  const interval = Math.max(2500, Number(autoplayMs) || 6000);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  useEffect(() => {
    if (!many) return undefined;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [many, interval, slides.length]);

  if (!product) return null;

  return (
    <div className="border border-border bg-surface">
      <div className="relative aspect-[16/9] product-stage">
        <img src={productImage(product)} alt={product.name || ''} className="h-full w-full object-contain p-6" />
        {many ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-surface"
              aria-label="Previous slide"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-surface"
              aria-label="Next slide"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
            >
              <ChevronRight />
            </Button>
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
        <p className="min-w-0 truncate text-sm font-medium">{product.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          {many ? (
            <div className="flex items-center gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={asId(slide) || i}
                  type="button"
                  aria-label={slide.name || `Slide ${i + 1}`}
                  className={cn('h-1.5 rounded-sm', i === index ? 'w-6 bg-foreground' : 'w-3 bg-border')}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          ) : null}
          {onRemove ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onRemove(product)}>
              <X />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
