import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Package, Shield, Truck } from 'lucide-react';
import { catalogApi, listFrom } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { idOf, PLACEHOLDER_IMAGES, productImage } from '@/lib/product';
import { getRecentlyViewed } from '@/lib/storage';
import { useReducedMotion } from '@/hooks/useMedia';
import { useSettings } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductCard } from '@/components/product/ProductCard';
import { RatingStars } from '@/components/product/RatingStars';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { Seo, orgJsonLd } from '@/components/Seo';
import { Container } from '@/components/layout/Container';
import { toast } from 'sonner';

const ProductViewer3D = lazy(() => import('@/components/three/ProductViewer3D'));

function useProductList(params, key) {
  return useQuery({
    queryKey: ['products', key, params],
    queryFn: () => catalogApi.products(params),
  });
}

export function HomePage() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const featured = useProductList({ sort: 'featured', limit: 1 }, 'hero');
  const best = useProductList({ sort: 'bestseller', limit: 4 }, 'best');
  const arrivals = useProductList({ sort: 'newest', limit: 3 }, 'new');
  const sale = useProductList({ sort: 'sale', limit: 1 }, 'sale');
  const reviews = useQuery({
    queryKey: ['home-reviews'],
    queryFn: async () => {
      const list = listFrom((await catalogApi.products({ sort: 'rating', limit: 4 })).products || (await catalogApi.products({ limit: 4 })));
      return list;
    },
  });
  const cats = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories });
  const brands = useQuery({ queryKey: ['brands'], queryFn: catalogApi.brands });
  const showcase = useProductList({ visualMode: 'model3d', limit: 1 }, '3d');

  const hero = listFrom(featured.data)[0];
  const categories = listFrom(cats.data).filter((c) => c.showOnHomepage || c.isFeatured).slice(0, 4);
  const catTiles = categories.length ? categories : listFrom(cats.data).slice(0, 4);
  const bestList = listFrom(best.data);
  const newList = listFrom(arrivals.data);
  const saleProduct = listFrom(sale.data)[0];
  const threeProduct = listFrom(showcase.data)[0] || hero;
  const brandList = listFrom(brands.data);
  const reviewProducts = listFrom(reviews.data);

  const recentIds = getRecentlyViewed();
  const recentQ = useQuery({
    queryKey: ['recent', recentIds],
    queryFn: () => catalogApi.compare(recentIds),
    enabled: recentIds.length > 0,
  });
  const recent = listFrom(recentQ.data?.products || recentQ.data);

  return (
    <>
      <Seo
        title="ElectroPoint — Precision electronics"
        description={settings.seo?.description}
        canonical="/"
        jsonLd={orgJsonLd(settings)}
      />
      <Hero product={hero} reduced={reduced} />
      <CategoryTiles categories={catTiles} />
      {bestList.length ? <BestSellers products={bestList} /> : null}
      <NewArrivals products={newList} />
      {threeProduct ? <Showroom product={threeProduct} reduced={reduced} /> : null}
      {saleProduct ? <OffersBand product={saleProduct} /> : null}
      {brandList.length ? <BrandRow brands={brandList} /> : null}
      <GuideTeaser />
      <TrustFacts />
      <WarrantyBand />
      {reviewProducts.length ? <ReviewsRow products={reviewProducts} /> : null}
      {recent.length ? (
        <section className="py-18">
          <Container>
            <h2 className="font-display text-h2">Recently viewed</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {recent.slice(0, 4).map((p) => (
                <ProductCard key={idOf(p)} product={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
      <Newsletter />
    </>
  );
}

function Hero({ product, reduced }) {
  const wrapRef = useRef(null);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      setTilt(p * 0.35);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced]);

  const specs = (product?.specGroups?.[0]?.fields || []).slice(0, 4);
  const img = product ? productImage(product) : PLACEHOLDER_IMAGES.laptop;

  return (
    <section ref={wrapRef} className="border-b border-border bg-surface">
      <Container className="grid min-h-[calc(100vh-100px)] items-center gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-0">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <p className="caption">Flagship</p>
          <h1 className="mt-3 font-display text-display">
            {product ? 'Precision in every watt' : 'Engineered for the work'}
          </h1>
          <p className="mt-4 max-w-md text-muted">
            {product?.shortDescription || 'Specified hardware. Clear pricing in NPR. Official warranty on every device we sell.'}
          </p>
          {product ? <PriceDisplay className="mt-6" size="lg" pricePaisa={product.pricePaisa} salePricePaisa={product.salePricePaisa} /> : null}
          {specs.length ? (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 spec-text">
              {specs.map((f) => (
                <div key={f.key || f.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={product ? `/product/${product.slug}` : '/shop'}>Shop flagship</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/shop">Explore categories</Link>
            </Button>
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7">
          <div className="relative aspect-[4/3] product-stage lg:aspect-[5/4]" style={{ transform: reduced ? undefined : `perspective(1200px) rotateY(${tilt * 8}deg)` }}>
            {product?.visualMode === 'model3d' && !reduced ? (
              <Suspense fallback={<img src={img} alt={product?.name || 'Flagship device'} className="h-full w-full object-contain p-8" />}>
                <ProductViewer3D product={product} className="h-full w-full" scrollInfluence />
              </Suspense>
            ) : (
              <img src={img} alt={product?.name || 'Flagship laptop'} className="h-full w-full object-contain p-6 md:p-10" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function CategoryTiles({ categories }) {
  if (!categories.length) return null;
  return (
    <section className="py-18">
      <Container>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-h2">Shop by category</h2>
          <Link to="/shop" className="hidden text-sm text-accent hover:underline sm:inline">
            All products
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden border border-border"
            >
              <img
                src={c.image || c.banner || PLACEHOLDER_IMAGES.generic}
                alt=""
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
              />
              <span className="absolute inset-x-0 bottom-0 bg-foreground/70 px-4 py-3 text-sm font-medium text-background">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function BestSellers({ products }) {
  return (
    <section className="border-y border-border bg-surface py-24">
      <Container>
        <h2 className="font-display text-h2">Best sellers</h2>
        <p className="mt-2 text-sm text-muted">Devices customers actually buy — ranked from orders, not ads.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={idOf(p)} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function NewArrivals({ products }) {
  const [large, ...rest] = products;
  if (!products.length) return null;
  return (
    <section className="py-24">
      <Container>
        <h2 className="font-display text-h2">New arrivals</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {large ? (
            <Link to={`/product/${large.slug}`} className="group border border-border bg-surface">
              <div className="aspect-[16/10] product-stage">
                <img src={productImage(large)} alt={large.name} className="h-full w-full object-contain p-8" />
              </div>
              <div className="p-6">
                <p className="caption">{large.brand}</p>
                <h3 className="mt-1 font-display text-xl font-semibold group-hover:text-accent">{large.name}</h3>
                <PriceDisplay className="mt-3" pricePaisa={large.pricePaisa} salePricePaisa={large.salePricePaisa} />
              </div>
            </Link>
          ) : null}
          <div className="flex flex-col gap-4">
            {rest.slice(0, 2).map((p) => (
              <Link key={idOf(p)} to={`/product/${p.slug}`} className="flex flex-1 gap-4 border border-border bg-surface p-4 hover:border-foreground/30">
                <div className="h-28 w-28 shrink-0 product-stage">
                  <img src={productImage(p)} alt="" className="h-full w-full object-contain p-2" />
                </div>
                <div className="min-w-0 self-center">
                  <p className="caption">{p.brand}</p>
                  <h3 className="font-medium">{p.name}</h3>
                  <PriceDisplay size="sm" className="mt-2" pricePaisa={p.pricePaisa} salePricePaisa={p.salePricePaisa} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showroom({ product, reduced }) {
  if (!product) return null;
  return (
    <section className="bg-[#0B0C0E] py-24 text-[#F2F4F7]">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="min-h-[360px]">
          {reduced ? (
            <img src={productImage(product)} alt={product.name} className="mx-auto max-h-[420px] object-contain" />
          ) : (
            <Suspense fallback={<img src={productImage(product)} alt="" className="mx-auto max-h-[420px] object-contain opacity-70" />}>
              <ProductViewer3D product={product} className="h-[420px]" />
            </Suspense>
          )}
        </div>
        <div>
          <p className="caption text-[#9AA3AE]">Showroom</p>
          <h2 className="mt-2 font-display text-h2">See the chassis, not a render farm</h2>
          <p className="mt-4 max-w-md text-[#9AA3AE]">
            Interactive 3D on selected products. Orbit, zoom, reset. Photography remains the default.
          </p>
          <Button asChild className="mt-8 bg-[#F2F4F7] text-[#0B0D10] hover:bg-white">
            <Link to={`/product/${product.slug}`}>
              Inspect {product.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function OffersBand({ product }) {
  if (!product) return null;
  return (
    <section className="border-y border-border">
      <Container className="flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
        <div>
          <p className="caption text-danger">Limited offer</p>
          <p className="mt-1 font-display text-lg font-semibold">{product.name}</p>
          <p className="text-sm text-muted">
            {formatNpr(product.salePricePaisa || product.pricePaisa)} · while stock lasts
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/product/${product.slug}`}>View offer</Link>
        </Button>
      </Container>
    </section>
  );
}

function BrandRow({ brands }) {
  const names = brands.length ? brands.map((b) => b.name || b) : ['Apple', 'Samsung', 'Sony', 'Dell', 'Lenovo', 'ASUS', 'LG', 'Bose'];
  return (
    <section className="py-16">
      <Container>
        <p className="caption text-center">Brands we stock</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted">
          {names.slice(0, 10).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function GuideTeaser() {
  return (
    <section className="bg-surface py-24">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="caption">Buying guide</p>
          <h2 className="mt-2 font-display text-h2">Compare before you commit</h2>
          <p className="mt-4 max-w-md text-muted">
            Put up to four devices side by side — processor, memory, panel, battery, warranty. Specs come from the catalog, not marketing copy.
          </p>
          <Button asChild className="mt-8">
            <Link to="/compare">Open compare</Link>
          </Button>
        </div>
        <div className="border border-border p-6 spec-text text-sm">
          <div className="grid grid-cols-3 gap-4 border-b border-border pb-3 text-muted">
            <span />
            <span>Device A</span>
            <span>Device B</span>
          </div>
          {['Display', 'SoC', 'RAM', 'Battery'].map((row) => (
            <div key={row} className="grid grid-cols-3 gap-4 border-b border-border py-3 last:border-0">
              <span className="text-muted">{row}</span>
              <span>—</span>
              <span>—</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function TrustFacts() {
  const items = [
    { icon: Shield, title: 'Official warranty', body: 'Mapped to manufacturer terms. Serial recorded on paid orders.' },
    { icon: BadgeCheck, title: 'Authentic stock', body: 'Sourced through authorized channels. No grey-market lottery.' },
    { icon: Truck, title: 'Tracked delivery', body: 'Kathmandu express and nationwide standard. Rates from admin settings.' },
    { icon: Package, title: 'Clear returns', body: 'DOA handling through support. Status visible on every order.' },
  ];
  return (
    <section className="py-24">
      <Container className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`px-0 py-6 sm:px-6 ${i ? 'lg:border-l lg:border-border' : ''}`}>
            <Icon className="h-5 w-5 text-foreground" aria-hidden />
            <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}

function WarrantyBand() {
  return (
    <section className="border-y border-border bg-muted-bg">
      <Container className="flex flex-col gap-2 py-10 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-lg font-semibold">Pay in NPR. eSewa and Khalti, verified on the server.</p>
        <p className="text-sm text-muted">We never trust a frontend “success” flag. Gateways are confirmed before stock commits.</p>
      </Container>
    </section>
  );
}

function ReviewsRow({ products }) {
  const withRating = products.filter((p) => p.ratingCount);
  if (!withRating.length) return null;
  return (
    <section className="py-24">
      <Container>
        <h2 className="font-display text-h2">From verified buyers</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {withRating.slice(0, 2).map((p) => (
            <blockquote key={idOf(p)} className="border border-border bg-surface p-6">
              <RatingStars value={p.ratingAvg} count={p.ratingCount} />
              <p className="mt-4 text-foreground">Rated {Number(p.ratingAvg).toFixed(1)} for {p.name}.</p>
              <footer className="mt-4 text-sm text-muted">
                <Link to={`/product/${p.slug}`} className="hover:text-accent">
                  {p.brand} · {p.name}
                </Link>
              </footer>
            </blockquote>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  return (
    <section className="border-t border-border py-16">
      <Container className="flex max-w-xl flex-col gap-4">
        <h2 className="font-display text-h3">Product notes, not spam</h2>
        <p className="text-sm text-muted">Restocks and genuine price drops. Unsubscribe any time.</p>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success('If this store enables newsletters, you are on the list.');
            setEmail('');
          }}
        >
          <div className="flex-1">
            <Label htmlFor="nl" className="sr-only">
              Email
            </Label>
            <Input id="nl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <Button type="submit">Subscribe</Button>
        </form>
      </Container>
    </section>
  );
}
