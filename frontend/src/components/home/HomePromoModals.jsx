import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Copy, Ticket, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useReducedMotion } from '@/hooks/useMedia';
import { dueHomepagePopups, markPopupDismissed } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ProductThumb } from '@/components/product/ProductThumb';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

export function HomePromoModals({ popups, onComplete }) {
  const reduced = useReducedMotion();
  const queue = useMemo(() => dueHomepagePopups(popups), [popups]);

  const [open, setOpen] = useState(() => Boolean(queue.length));
  const [index, setIndex] = useState(0);
  const finishRef = useRef(false);

  const finish = () => {
    if (finishRef.current) return;
    finishRef.current = true;
    setOpen(false);
    onComplete?.();
  };

  useEffect(() => {
    if (queue.length) return undefined;
    finish();
    return undefined;
  }, [queue.length]);

  const popup = queue[index];
  if (!popup) return null;

  const dismiss = () => {
    if (popup.frequency !== 'always') markPopupDismissed(popup.id);
    const next = index + 1;
    if (next < queue.length) {
      setIndex(next);
      return;
    }
    finish();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-foreground/50 data-[state=open]:animate-popup-overlay-in data-[state=closed]:animate-popup-overlay-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-border bg-surface shadow-md outline-none',
            reduced ? '' : 'data-[state=open]:animate-popup-in data-[state=closed]:animate-popup-out',
          )}
          aria-describedby={undefined}
        >
          <PopupBody
            key={popup.id}
            popup={popup}
            products={popup.products || []}
            reduced={reduced}
            queueIndex={index}
            queueTotal={queue.length}
            onDismiss={dismiss}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PopupBody({ popup, products, reduced, queueIndex, queueTotal, onDismiss }) {
  const { applyCoupon } = useCart();
  const images = popup.images || [];
  const manyImages = hasMultiple(images);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const coupons = popup.coupons || [];

  useEffect(() => {
    if (reduced || !manyImages || paused) return undefined;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % images.length), 4500);
    return () => window.clearInterval(t);
  }, [images.length, manyImages, paused, reduced]);

  const href = popup.ctaHref || '';
  const internal = href.startsWith('/');

  return (
    <div className={cn('grid max-h-[90vh] overflow-y-auto', images.length ? 'md:grid-cols-2' : '', reduced ? '' : 'animate-popup-swap')}>
      {images.length ? (
        <div
          className="relative min-h-[220px] bg-product-stage md:min-h-[420px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-200',
                i === slide ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
          {manyImages ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-md border border-border bg-surface p-1.5 text-foreground"
                aria-label="Previous image"
                onClick={() => setSlide((s) => (s - 1 + images.length) % images.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-md border border-border bg-surface p-1.5 text-foreground"
                aria-label="Next image"
                onClick={() => setSlide((s) => (s + 1) % images.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Image ${i + 1}`}
                    className={cn('h-1.5 w-1.5 cursor-pointer rounded-full', i === slide ? 'bg-accent' : 'bg-border')}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex flex-col p-6 sm:p-8">
        <button
          type="button"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-md p-1 text-muted hover:text-foreground"
          aria-label="Close"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>

        {hasMultipleQueue(queueTotal) ? (
          <p className="caption">
            Offer {queueIndex + 1} of {queueTotal}
          </p>
        ) : null}
        {popup.kicker ? <p className={hasMultipleQueue(queueTotal) ? 'mt-1 caption' : 'caption'}>{popup.kicker}</p> : null}

        <DialogPrimitive.Title className="mt-2 font-display text-xl font-semibold tracking-tight">
          {popup.title || 'From ElectroPoint'}
        </DialogPrimitive.Title>
        {popup.body ? <DialogPrimitive.Description className="mt-2 text-sm text-muted">{popup.body}</DialogPrimitive.Description> : (
          <DialogPrimitive.Description className="sr-only">Store announcement</DialogPrimitive.Description>
        )}

        {coupons.length ? (
          <ul className="mt-5 space-y-2">
            {coupons.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 border border-border bg-muted-bg px-3 py-2">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium">
                    <Ticket className="h-3.5 w-3.5 text-accent" aria-hidden />
                    {c.code}
                  </span>
                  <span className="block text-xs text-muted">{c.label}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Copy ${c.code}`}
                    onClick={() => copyCode(c.code)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyCoupon.mutate(c.code)} disabled={applyCoupon.isPending}>
                    Apply
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {products.length ? (
          <ul className="mt-5 space-y-2">
            {products.map((p) => (
              <li key={p._id || p.id}>
                <Link
                  to={`/product/${p.slug}`}
                  className="flex items-center gap-3 border border-border p-2 transition-colors duration-200 hover:border-foreground/30"
                  onClick={onDismiss}
                >
                  <ProductThumb product={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <PriceDisplay className="mt-0.5" size="sm" pricePaisa={p.pricePaisa} salePricePaisa={p.salePricePaisa} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {href && popup.ctaLabel ? (
          <div className="mt-6">
            <Button asChild>
              {internal ? <Link to={href}>{popup.ctaLabel}</Link> : <a href={href}>{popup.ctaLabel}</a>}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function hasMultiple(arr) {
  return (arr || []).length >= 2;
}

function hasMultipleQueue(total) {
  return total >= 2;
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  } catch {
    toast.error('Could not copy');
  }
}
