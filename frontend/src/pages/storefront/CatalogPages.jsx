import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { catalogApi, listFrom, metaFrom } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Container } from '@/components/layout/Container';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';
import { Search } from 'lucide-react';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestseller', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Rating' },
];

export function ShopPage() {
  return <CatalogView title="Shop" canonical="/shop" />;
}

export function CategoryPage() {
  const { slug } = useParams();
  const cat = useQuery({ queryKey: ['category', slug], queryFn: () => catalogApi.category(slug), enabled: Boolean(slug) });
  const category = cat.data?.category || cat.data;
  return (
    <CatalogView
      title={category?.name || 'Category'}
      description={category?.seoDescription || category?.description}
      canonical={`/category/${slug}`}
      categorySlug={slug}
      banner={category?.banner}
      crumbs={[{ name: 'Home', href: '/' }, { name: 'Shop', href: '/shop' }, { name: category?.name || slug }]}
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

function CatalogView({ title, description, canonical, categorySlug, banner, crumbs, emptyTitle, emptyBody, emptyIcon }) {
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      inStock: sp.get('inStock') === '1' || undefined,
      sort: sp.get('sort') || 'newest',
      page: Number(sp.get('page') || 1),
      limit: 24,
      rating: sp.get('rating') || undefined,
      filters,
    };
  }, [sp, categorySlug]);

  const query = useQuery({
    queryKey: ['catalog', params],
    queryFn: () => catalogApi.products(params),
  });

  const products = listFrom(query.data);
  const meta = metaFrom(query.data);
  const available = query.data?.filters || query.data?.availableFilters || {};
  const brands = available.brands || available.brand || [];
  const specFilters = available.specFilters || available.specs || [];

  const setParam = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value == null || value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setSp(next);
  };

  const filterForm = (
    <FilterForm
      params={params}
      brands={Array.isArray(brands) ? brands : []}
      specFilters={Array.isArray(specFilters) ? specFilters : []}
      setParam={setParam}
      sp={sp}
      setSp={setSp}
    />
  );

  return (
    <>
      <Seo
        title={title}
        description={description}
        canonical={canonical}
        jsonLd={crumbs ? breadcrumbJsonLd(crumbs) : undefined}
      />
      {banner ? (
        <div className="h-40 overflow-hidden border-b border-border md:h-56">
          <img src={banner} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <Container className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-h1">{title}</h1>
            <p className="mt-1 text-sm text-muted">{meta.total} products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">{filterForm}</aside>
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
        <SheetContent side="bottom" title="Filters">
          {filterForm}
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterForm({ params, brands, specFilters, setParam, sp, setSp }) {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend className="caption mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={Boolean(params.inStock)} onCheckedChange={(v) => setParam('inStock', v ? '1' : '')} />
          In stock
        </label>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="caption mb-3">Price (NPR paisa)</legend>
        <div className="flex gap-2">
          <div>
            <Label htmlFor="minPrice">Min</Label>
            <Input id="minPrice" inputMode="numeric" defaultValue={params.minPrice} onBlur={(e) => setParam('minPrice', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="maxPrice">Max</Label>
            <Input id="maxPrice" inputMode="numeric" defaultValue={params.maxPrice} onBlur={(e) => setParam('maxPrice', e.target.value)} />
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend className="caption mb-3">Rating</legend>
        {['4', '3'].map((r) => (
          <label key={r} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={params.rating === r} onCheckedChange={(v) => setParam('rating', v ? r : '')} />
            {r}+ stars
          </label>
        ))}
      </fieldset>
      {brands.length ? (
        <fieldset>
          <legend className="caption mb-3">Brand</legend>
          {brands.slice(0, 12).map((b) => {
            const name = b.name || b;
            return (
              <label key={name} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={params.brand === name} onCheckedChange={(v) => setParam('brand', v ? name : '')} />
                {name}
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {specFilters.map((sf) => (
        <fieldset key={sf.key}>
          <legend className="caption mb-3">{sf.label || sf.key}</legend>
          {(sf.values || []).map((val) => {
            const k = `filters[${sf.key}]`;
            const checked = sp.get(k) === String(val);
            return (
              <label key={val} className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = new URLSearchParams(sp);
                    if (v) next.set(k, String(val));
                    else next.delete(k);
                    next.delete('page');
                    setSp(next);
                  }}
                />
                {val}
              </label>
            );
          })}
        </fieldset>
      ))}
    </form>
  );
}
