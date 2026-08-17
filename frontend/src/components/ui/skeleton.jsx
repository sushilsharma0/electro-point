import { cn } from '@/lib/cn';
import { Container } from '@/components/layout/Container';

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton-block rounded-sm', className)} {...props} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-border bg-surface">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PdpSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-sm" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 border border-border p-4">
            <Skeleton className="h-24 w-24 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 border border-border p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function CartDrawerSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="grid min-h-[70vh] items-center gap-10 py-12 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-12 w-40" />
          </div>
          <Skeleton className="aspect-square w-full lg:col-span-7" />
        </Container>
      </div>
      <Container className="py-16">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
        <Skeleton className="mb-8 mt-16 h-8 w-40" />
        <ProductGridSkeleton count={4} />
      </Container>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </Container>
  );
}

export function CompareSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </Container>
  );
}

export function FormSkeleton() {
  return (
    <Container className="max-w-md py-16">
      <Skeleton className="h-9 w-56" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </Container>
  );
}

export function ContentSkeleton() {
  return (
    <Container className="max-w-2xl py-16">
      <Skeleton className="h-10 w-2/3" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Container>
  );
}

export function AccountSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border border-border p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function AccountOrderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex justify-between border-b border-border py-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

export function AddressSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 border border-border p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <Container className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="mt-6 h-7 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-3 border border-border p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </Container>
  );
}

export function PaymentConfirmSkeleton() {
  return (
    <Container className="max-w-lg py-16">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto h-4 w-full max-w-sm" />
        <Skeleton className="mx-auto h-4 w-2/3" />
        <Skeleton className="mx-auto mt-6 h-24 w-full" />
      </div>
    </Container>
  );
}

export function MegaMenuSkeleton() {
  return (
    <div className="absolute left-0 right-0 top-full z-40 border-b border-border bg-surface-elevated shadow-md">
      <div className="mx-auto grid max-w-store grid-cols-12 gap-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="col-span-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="col-span-9 grid grid-cols-3 gap-4 pl-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FooterLinksSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-4 w-28" />
        </li>
      ))}
    </>
  );
}

export function StorefrontRouteSkeleton({ pathname = '/' }) {
  if (pathname.startsWith('/product/')) {
    return (
      <Container className="py-10">
        <PdpSkeleton />
      </Container>
    );
  }
  if (pathname.startsWith('/shop') || pathname.startsWith('/category') || pathname.startsWith('/search')) {
    return <CatalogSkeleton />;
  }
  if (pathname.startsWith('/cart')) {
    return (
      <Container className="py-10">
        <CartSkeleton />
      </Container>
    );
  }
  if (pathname.startsWith('/compare')) return <CompareSkeleton />;
  if (pathname.startsWith('/checkout')) return <CheckoutSkeleton />;
  if (pathname.startsWith('/account')) {
    return (
      <Container className="py-10">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-6 h-10 w-full" />
        <div className="mt-8">
          <AccountSkeleton />
        </div>
      </Container>
    );
  }
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return <FormSkeleton />;
  }
  if (pathname.startsWith('/payments/')) return <PaymentConfirmSkeleton />;
  if (
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy')
  ) {
    return <ContentSkeleton />;
  }
  return <HomeSkeleton />;
}
