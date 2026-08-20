import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { catalogApi, listFrom, metaFrom } from '@/lib/api';
import { nprToPaisa, paisaToNpr } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { CatalogSkeleton } from '@/components/ui/skeleton';
import { WithTooltip } from '@/components/ui/tooltip';
import { useBrands, useCategories } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestseller', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Rating' },
];

const PRICE_PRESETS = [
  { label: 'Under 10,000', min: '', max: 1_000_000 },
  { label: '10,000 – 25,000', min: 1_000_000, max: 2_500_000 },
  { label: '25,000 – 50,000', min: 2_500_000, max: 5_000_000 },
  { label: '50,000 – 1,00,000', min: 5_000_000, max: 10_000_000 },
  { label: '1,00,000+', min: 10_000_000, max: '' },
];

function CategoryBanner({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) return null;
  return (
    <div className="border-b border-border bg-product-stage">
      <div className="mx-auto h-40 max-w-store overflow-hidden md:h-56">
        <img src={src} alt={alt || ''} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      </div>
    </div>
  );
}

function flagParam(sp, key) {
  const v = sp.get(key);
  return v === '1' || v === 'true';
}

export function ShopPage() {
  return <CatalogView title="Shop" canonical="/shop" />;
}

export function CategoryPage() {
  const { slug } = useParams();
  const cat = useQuery({ queryKey: ['category', slug], queryFn: () => catalogApi.category(slug), enabled: Boolean(slug) });
  const category = cat.data?.category || cat.data;
  if (cat.isLoading) return <CatalogSkeleton />;
  return (
    <CatalogView
      title={category?.name || 'Category'}
      description={category?.seoDescription || category?.description}
      canonical={`/category/${slug}`}
      categorySlug={slug}
      banner={category?.banner || category?.image || ''}
      bannerAlt={category?.name || ''}
    />
  );
}

export function SearchPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  return (
    <CatalogView
      title={q ? `Results for “${q}”` : 'Search'}
      canonical={`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`}
      emptyTitle="No search results"
      emptyBody="Try a brand, SKU, or a shorter query. Filters are generated from live catalog specs."
      emptyIcon={Search}
    />
  );
}

function CatalogView({ title, description, canonical, categorySlug, banner, bannerAlt, emptyTitle, emptyBody, emptyIcon }) {
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const catsQuery = useCategories();
  const brandsQuery = useBrands();
  const params = useMemo(() => {
    const filters = {};
    sp.forEach((v, k) => {
      const m = k.match(/^filters\[(.+)\]$/);
      if (m) filters[m[1]] = v;
    });
    return {
      q: sp.get('q') || undefined,
      category: categorySlug || sp.get('category') || undefined,
      brand: sp.get('brand') || undefined,
      minPrice: sp.get('minPrice') || undefined,
      maxPrice: sp.get('maxPrice') || undefined,
      inStock: flagParam(sp, 'inStock') || undefined,
      onSale: flagParam(sp, 'onSale') || undefined,
      newArrival: flagParam(sp, 'newArrival') || undefined,
      featured: flagParam(sp, 'featured') || undefined,
      bestSeller: flagParam(sp, 'bestSeller') || undefined,
      sort: sp.get('sort') || 'newest',
      page: Number(sp.get('page') || 1),
      limit: 24,
      rating: sp.get('rating') || undefined,
      facets: '1',
      filters,
    };
  }, [sp, categorySlug]);

  const query = useQuery({
    queryKey: ['catalog', params],
    queryFn: () => catalogApi.products(params),
  });

  const products = listFrom(query.data);
  const meta = metaFrom(query.data);
  const available = query.data?.availableFilters || query.data?.filters || meta.filters || {};
  const categories = listFrom(catsQuery.data).filter((c) => !c.parent);
  const brands = (Array.isArray(available.brands) && available.brands.length
    ? available.brands
    : listFrom(brandsQuery.data)).map((b) => (typeof b === 'string' ? b : b.name)).filter(Boolean);

  const setParam = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value == null || value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setSp(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (sp.get('q')) next.set('q', sp.get('q'));
    if (sp.get('sort')) next.set('sort', sp.get('sort'));
    setSp(next);
  };

  const filterKeys = [...sp.keys()].filter((k) => k !== 'q' && k !== 'sort' && k !== 'page');
  const hasFilters = filterKeys.length > 0;

  const filterProps = {
    params,
    brands,
    categories: categorySlug ? [] : categories,
    setParam,
    sp,
    setSp,
    hasFilters,
    onClear: clearFilters,
  };

  if (query.isLoading) return <CatalogSkeleton />;

  return (
    <>
      <Seo
        title={title}
        description={description}
        canonical={canonical}
      />
      {banner ? <CategoryBanner src={banner} alt={bannerAlt || title} /> : null}
      <Container className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-h1">{title}</h1>
            <p className="mt-1 text-sm text-muted">{meta.total} products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <WithTooltip label="Filters">
                <SlidersHorizontal className="h-4 w-4" />
              </WithTooltip>
              Filters
            </Button>
            <Select value={params.sort} onValueChange={(v) => setParam('sort', v)}>
              <SelectTrigger className="w-[180px]" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <FilterForm compact onMore={() => setFiltersOpen(true)} {...filterProps} />
          </aside>
          <div>
            <ProductGrid
              products={products}
              isLoading={query.isLoading}
              emptyTitle={emptyTitle || 'No products match'}
              emptyBody={emptyBody || 'Adjust filters or browse another category.'}
            />
            {meta.pages > 1 ? (
              <div className="mt-8 flex justify-center gap-2">
                <Button type="button" variant="outline" disabled={params.page <= 1} onClick={() => setParam('page', params.page - 1)}>
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-muted">
                  {params.page} / {meta.pages}
                </span>
                <Button type="button" variant="outline" disabled={params.page >= meta.pages} onClick={() => setParam('page', params.page + 1)}>
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" title="Filters" className="w-full max-w-sm pt-12">
          <div className="mb-6 flex items-end justify-between gap-3 pr-8">
            <div>
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <p className="mt-1 text-sm text-muted">{meta.total} products</p>
            </div>
          </div>
          <FilterForm {...filterProps} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterForm({
  params,
  brands,
  categories,
  setParam,
  sp,
  setSp,
  hasFilters,
  onClear,
  compact = false,
  onMore,
}) {
  const selectedBrands = (params.brand || '').split(',').map((s) => s.trim()).filter(Boolean);
  const minNpr = params.minPrice ? String(Math.round(paisaToNpr(params.minPrice))) : '';
  const maxNpr = params.maxPrice ? String(Math.round(paisaToNpr(params.maxPrice))) : '';
  const prefix = compact ? 'quick' : 'all';
  const shownBrands = compact ? brands.slice(0, 4) : brands;
  const shownCategories = compact ? categories.slice(0, 4) : categories;
  const shownPresets = compact ? PRICE_PRESETS.slice(0, 3) : PRICE_PRESETS;

  const toggleBrand = (name) => {
    const next = selectedBrands.includes(name)
      ? selectedBrands.filter((b) => b !== name)
      : [...selectedBrands, name];
    setParam('brand', next.join(','));
  };

  const setPrice = (min, max) => {
    const next = new URLSearchParams(sp);
    if (min === '' || min == null) next.delete('minPrice');
    else next.set('minPrice', String(min));
    if (max === '' || max == null) next.delete('maxPrice');
    else next.set('maxPrice', String(max));
    next.delete('page');
    setSp(next);
  };

  const presetActive = (preset) =>
    String(params.minPrice || '') === String(preset.min) && String(params.maxPrice || '') === String(preset.max);

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {hasFilters ? (
        <Button type="button" variant="ghost" className="h-auto px-0 text-sm text-accent" onClick={onClear}>
          Clear all filters
        </Button>
      ) : null}

      {shownCategories.length ? (
        <fieldset>
          <legend className="caption mb-3">Category</legend>
          {shownCategories.map((c) => (
            <label key={c.slug} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={params.category === c.slug}
                onCheckedChange={(v) => setParam('category', v ? c.slug : '')}
              />
              {c.name}
            </label>
          ))}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="caption mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={Boolean(params.inStock)} onCheckedChange={(v) => setParam('inStock', v ? '1' : '')} />
          In stock
        </label>
      </fieldset>

      {compact ? (
        <fieldset>
          <legend className="caption mb-3">Offers</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(params.onSale)} onCheckedChange={(v) => setParam('onSale', v ? '1' : '')} />
            On sale
          </label>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="caption mb-3">Offers</legend>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(params.onSale)} onCheckedChange={(v) => setParam('onSale', v ? '1' : '')} />
            On sale
          </label>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(params.newArrival)} onCheckedChange={(v) => setParam('newArrival', v ? '1' : '')} />
            New arrivals
          </label>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(params.featured)} onCheckedChange={(v) => setParam('featured', v ? '1' : '')} />
            Featured
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(params.bestSeller)} onCheckedChange={(v) => setParam('bestSeller', v ? '1' : '')} />
            Best sellers
          </label>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="caption mb-3">Price (NPR)</legend>
        <div className="flex flex-col gap-1.5">
          {shownPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={cn(
                'cursor-pointer px-2 py-1.5 text-left text-sm transition-colors duration-200',
                presetActive(preset) ? 'bg-muted-bg text-foreground' : 'text-muted hover:bg-muted-bg hover:text-foreground',
              )}
              onClick={() => setPrice(preset.min, preset.max)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {compact ? null : (
          <div className="flex gap-2 pt-1">
            <div>
              <Label htmlFor={`${prefix}-minPrice`}>Min</Label>
              <Input
                id={`${prefix}-minPrice`}
                key={`min-${params.minPrice || ''}`}
                inputMode="numeric"
                placeholder="0"
                defaultValue={minNpr}
                onBlur={(e) => setParam('minPrice', e.target.value === '' ? '' : nprToPaisa(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor={`${prefix}-maxPrice`}>Max</Label>
              <Input
                id={`${prefix}-maxPrice`}
                key={`max-${params.maxPrice || ''}`}
                inputMode="numeric"
                placeholder="Any"
                defaultValue={maxNpr}
                onBlur={(e) => setParam('maxPrice', e.target.value === '' ? '' : nprToPaisa(e.target.value))}
              />
            </div>
          </div>
        )}
      </fieldset>

      {compact ? null : (
        <fieldset>
          <legend className="caption mb-3">Rating</legend>
          {['5', '4', '3'].map((r) => (
            <label key={r} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={String(params.rating) === r} onCheckedChange={(v) => setParam('rating', v ? r : '')} />
              {r}+ stars
            </label>
          ))}
        </fieldset>
      )}

      {shownBrands.length ? (
        <fieldset>
          <legend className="caption mb-3">Brand</legend>
          {shownBrands.map((name) => (
            <label key={name} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={selectedBrands.includes(name)} onCheckedChange={() => toggleBrand(name)} />
              {name}
            </label>
          ))}
        </fieldset>
      ) : null}

      {compact && onMore ? (
        <Button type="button" variant="outline" className="w-full" onClick={onMore}>
          More
          <ChevronRight />
        </Button>
      ) : null}
    </form>
  );
}
