import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { PLACEHOLDER_IMAGES, productImage } from '@/lib/product';
import { cn } from '@/lib/cn';

export function HeroCarousel({ products = [], reduced = false, autoplayMs = 6000 }) {
  const slides = products.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const product = slides[index] || null;
  const many = slides.length > 1;
  const duration = reduced ? 0 : 0.28;
  const interval = Math.max(1500, Number(autoplayMs) || 3000);
  const slideKey = product?._id || product?.slug || index;
  const offset = reduced ? 0 : 48;

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  useEffect(() => {
    if (!many) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDir(1);
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [many, interval, slides.length]);

  const go = (next, direction = 1) => {
    if (!slides.length) return;
    setDir(direction);
    setIndex((next + slides.length) % slides.length);
  };

  const specs = (product?.specGroups?.[0]?.fields || []).slice(0, 4);
  const img = product ? productImage(product) : PLACEHOLDER_IMAGES.laptop;
  const motionProps = {
    initial: { opacity: 0, x: offset * dir },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -offset * dir },
  };
  const transition = { duration, ease: [0.2, 0, 0, 1] };

  return (
    <section className="border-b border-border bg-surface">
      <Container className="relative grid min-h-[calc(100vh-100px)] items-center gap-10 py-12 pb-20 lg:grid-cols-12 lg:gap-12 lg:py-0 lg:pb-16">
        <div className="order-2 overflow-hidden lg:order-1 lg:col-span-5">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={slideKey} {...motionProps} transition={transition}>
              <p className="caption">{product?.brand || 'Flagship'}</p>
              <h1 className="mt-3 font-display text-display" aria-live="polite">
                {product?.name || 'Engineered for the work'}
              </h1>
              <p className="mt-4 max-w-md text-muted">
                {product?.shortDescription ||
                  'Specified hardware. Clear pricing in NPR. Official warranty on every device we sell.'}
              </p>
              {product ? (
                <PriceDisplay
                  className="mt-6"
                  size="lg"
                  pricePaisa={product.pricePaisa}
                  salePricePaisa={product.salePricePaisa}
                />
              ) : null}
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
                  <Link to={product ? `/product/${product.slug}` : '/shop'}>
                    {product ? 'Shop now' : 'Shop flagship'}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link to="/shop">Explore categories</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="order-1 overflow-hidden lg:order-2 lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideKey}
              {...motionProps}
              transition={transition}
              className="relative aspect-[4/3] product-stage lg:aspect-[5/4]"
            >
              <img
                src={img}
                alt={product?.name || 'Flagship device'}
                className="h-full w-full object-contain p-6 md:p-10"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {many ? (
          <div className="absolute inset-x-4 bottom-6 z-10 flex items-center justify-between lg:inset-x-0 lg:bottom-8">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 bg-surface"
                aria-label="Previous product"
                onClick={() => go(index - 1, -1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 bg-surface"
                aria-label="Next product"
                onClick={() => go(index + 1, 1)}
              >
                <ChevronRight />
              </Button>
            </div>
            <div className="flex items-center gap-2" role="tablist" aria-label="Hero products">
              {slides.map((slide, i) => (
                <button
                  key={slide._id || slide.slug || i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={slide.name || `Slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-sm',
                    i === index ? 'w-8 bg-foreground' : 'w-4 bg-border hover:bg-muted-bg',
                  )}
                  onClick={() => go(i, i > index ? 1 : -1)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
