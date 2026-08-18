import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, Heart, Minus, Plus, Shield, Truck, Wallet } from 'lucide-react';
import { catalogApi, listFrom } from '@/lib/api';
import { availableStock, idOf, productImage } from '@/lib/product';
import { pushRecentlyViewed } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { PdpSkeleton, ProductGridSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSpecs } from '@/components/product/ProductSpecs';
import { VariantPicker } from '@/components/product/VariantPicker';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { RatingStars } from '@/components/product/RatingStars';
import { StockStatus } from '@/components/product/StockStatus';
import { ProductCard } from '@/components/product/ProductCard';
import { Container } from '@/components/layout/Container';
import { Seo, productJsonLd } from '@/components/Seo';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompareStore } from '@/store/compare';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { NetworkErrorPage, NotFoundPage } from '@/pages/errors/ErrorPages';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { cn } from '@/lib/cn';

const ProductViewer3D = lazy(() => import('@/components/three/ProductViewer3D'));

export function ProductPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { toggle, ids } = useWishlist();
  const { user } = useAuth();
  const compare = useCompareStore();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState(null);
  const [spinIndex, setSpinIndex] = useState(0);

  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.product(slug),
    enabled: Boolean(slug),
  });

  const product = query.data?.product || query.data;
  const id = product ? idOf(product) : '';

  useEffect(() => {
    if (id) pushRecentlyViewed(id);
  }, [id]);

  useEffect(() => {
    if (product?.variants?.[0]) setVariantId(product.variants[0]._id || product.variants[0].id);
  }, [product]);

  const related = useQuery({
    queryKey: ['related', id],
    queryFn: () => catalogApi.related(id),
    enabled: Boolean(id),
  });

  const reviews = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => catalogApi.reviews(id),
    enabled: Boolean(id),
  });

  const variant = (product?.variants || []).find((v) => String(v._id || v.id) === String(variantId));
  const stockItem = variant || product;
  const inStock = product ? availableStock(stockItem) > 0 : false;
  const wished = ids.has(String(id));
  const reviewList = listFrom(reviews.data);

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <PdpSkeleton />
      </Container>
    );
  }
  if (query.isError && query.error?.status === 404) return <NotFoundPage />;
  if (query.isError) return <NetworkErrorPage onRetry={() => query.refetch()} />;
  if (!product?.name) return <NotFoundPage />;

  const addPayload = { productId: id, variantId, qty };
  const buyBox = (
    <>
      <p className="caption">{product.brand}</p>
      <h1 className="mt-1 font-display text-h1">{product.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <RatingStars value={product.ratingAvg} count={product.ratingCount} size="md" />
        <span className="text-xs text-muted">SKU {variant?.sku || product.sku}</span>
      </div>
      <PriceDisplay
        className="mt-5"
        size="lg"
        pricePaisa={variant?.pricePaisa ?? product.pricePaisa}
        salePricePaisa={variant?.salePricePaisa ?? product.salePricePaisa}
      />
      <StockStatus className="mt-2" item={stockItem} />
      <div className="mt-6">
        <VariantPicker variants={product.variants} selectedId={variantId} onChange={setVariantId} />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Label htmlFor="qty" className="sr-only">
          Quantity
        </Label>
        <div className="inline-flex items-center border border-border">
          <Button type="button" variant="ghost" size="icon" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input id="qty" className="h-10 w-12 border-0 text-center" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          <Button type="button" variant="ghost" size="icon" aria-label="Increase" onClick={() => setQty((q) => q + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="lg" disabled={!inStock || add.isPending} onClick={() => add.mutate(addPayload)}>
          Add to cart
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={!inStock}
          onClick={() => add.mutate(addPayload, { onSuccess: () => nav('/checkout') })}
        >
          Buy now
        </Button>
        <Button type="button" size="icon" variant="outline" className="h-12 w-12" aria-label="Wishlist" onClick={() => toggle(id)}>
          <Heart className={cn('h-4 w-4', wished && 'fill-current text-danger')} />
        </Button>
        <Button type="button" size="icon" variant="outline" className="h-12 w-12" aria-label="Compare" onClick={() => compare.toggle(id)}>
          <GitCompare className="h-4 w-4" />
        </Button>
      </div>
      <ul className="mt-8 space-y-3 text-sm text-muted">
        <li className="flex gap-2">
          <Shield className="mt-0.5 h-4 w-4 text-foreground" /> {product.warranty || 'Official manufacturer warranty'}
        </li>
        <li className="flex gap-2">
          <Truck className="mt-0.5 h-4 w-4 text-foreground" /> Delivery from store settings — quoted at checkout
        </li>
        <li className="flex gap-2">
          <Wallet className="mt-0.5 h-4 w-4 text-foreground" /> eSewa and Khalti. Totals calculated on the server.
        </li>
      </ul>
    </>
  );

  return (
    <>
      <Seo
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.shortDescription}
        canonical={`/product/${product.slug}`}
        image={productImage(product)}
        type="product"
        jsonLd={productJsonLd(product, `/product/${product.slug}`)}
      />
      <Container className="pt-4 pb-28 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              product={product}
              visualSlot={
                product.visualMode === 'model3d' ? (
                  <div className="absolute inset-0">
                    <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
                      <ProductViewer3D product={product} className="h-full" />
                    </Suspense>
                  </div>
                ) : null
              }
            />
            {product.visualMode === 'spin360' && product.spinImages?.length ? (
              <div className="mt-3">
                <Label htmlFor="spin">360°</Label>
                <input
                  id="spin"
                  type="range"
                  min={0}
                  max={product.spinImages.length - 1}
                  value={spinIndex}
                  onChange={(e) => setSpinIndex(Number(e.target.value))}
                  className="mt-2 w-full cursor-pointer"
                />
                <img src={product.spinImages[spinIndex]} alt="" className="mt-2 aspect-square w-full object-contain product-stage" />
              </div>
            ) : null}
          </div>
          <div>{buyBox}</div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            <section>
              <h2 className="font-display text-h3">Description</h2>
              <div className="mt-3 max-w-prose text-muted whitespace-pre-wrap">{product.description}</div>
            </section>
            {product.features?.length ? (
              <section>
                <h2 className="font-display text-h3">Key features</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {product.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ProductSpecs groups={product.specGroups} />
            {product.whatsIncluded?.length || product.included?.length ? (
              <section>
                <h2 className="font-display text-h3">What’s included</h2>
                <ul className="mt-3 list-disc pl-5 text-sm">
                  {(product.whatsIncluded || product.included).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ReviewsBlock productId={id} reviews={reviewList} canWrite={Boolean(user)} isLoading={reviews.isLoading} />
            <section>
              <h2 className="font-display text-h3">Questions</h2>
              <p className="mt-2 text-sm text-muted">Product questions will appear here when the store enables Q&A. For now, use the contact form.</p>
              <Button asChild variant="outline" className="mt-3">
                <Link to="/contact">Ask support</Link>
              </Button>
            </section>
          </div>
        </div>

        {related.isLoading ? (
          <section className="mt-16" aria-busy="true">
            <h2 className="font-display text-h2">Related</h2>
            <div className="mt-6">
              <ProductGridSkeleton count={4} />
            </div>
          </section>
        ) : listFrom(related.data).length ? (
          <section className="mt-16">
            <h2 className="font-display text-h2">Related</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {listFrom(related.data).slice(0, 4).map((p) => (
                <ProductCard key={idOf(p)} product={p} />
              ))}
            </div>
          </section>
        ) : null}
        <RecentlyViewed excludeId={id} className="mt-16" />
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 lg:hidden">
        <div className="flex items-center gap-3">
          <PriceDisplay
            size="sm"
            className="flex-1"
            pricePaisa={variant?.pricePaisa ?? product.pricePaisa}
            salePricePaisa={variant?.salePricePaisa ?? product.salePricePaisa}
          />
          <Button type="button" className="flex-1" disabled={!inStock} onClick={() => add.mutate(addPayload)}>
            Add to cart
          </Button>
        </div>
      </div>
    </>
  );
}

function ReviewsBlock({ productId, reviews, canWrite, isLoading }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <section>
      <h2 className="font-display text-h3">Reviews</h2>
      {isLoading ? (
        <div className="mt-4 space-y-4" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-border pb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length ? (
        <ul className="mt-4 space-y-4">
          {reviews.map((r) => (
            <li key={r._id} className="border-b border-border pb-4">
              <RatingStars value={r.rating} />
              <p className="mt-1 font-medium">{r.title}</p>
              <p className="text-sm text-muted">{r.body}</p>
              {r.verifiedPurchase ? <p className="mt-1 text-xs text-success">Verified purchase</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No published reviews yet.</p>
      )}
      {canWrite ? (
        <form
          className="mt-6 max-w-lg space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await catalogApi.createReview({ productId, rating, title, body });
              toast.success('Review submitted for moderation');
              setTitle('');
              setBody('');
            } catch (err) {
              toast.error(err.message || 'Could not submit review');
            }
          }}
        >
          <Label htmlFor="rev-title">Write a review</Label>
          <Input id="rev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <Label htmlFor="rev-body" className="sr-only">
            Review body
          </Label>
          <Textarea id="rev-body" value={body} onChange={(e) => setBody(e.target.value)} required />
          <Label htmlFor="rev-rating">Rating</Label>
          <Input id="rev-rating" type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          <Button type="submit">Submit</Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>{' '}
          after a verified purchase to review.
        </p>
      )}
    </section>
  );
}
