import { Link, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Lock } from 'lucide-react';
import { StorefrontOutletFallback } from '@/components/loading/RouteFallback';
import { StorefrontBreadcrumbs } from '@/components/layout/StorefrontBreadcrumbs';
import { MaintenanceModal } from '@/components/layout/MaintenanceModal';
import { useSettings } from '@/hooks/useCatalog';

export function CheckoutLayout() {
  const { settings } = useSettings();
  if (settings.maintenanceMode) return <MaintenanceModal />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-store items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-1.5 text-muted sm:inline-flex">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Secure checkout
            </span>
            <ThemeToggle />
            <Link to="/cart" className="text-accent hover:underline">
              Back to cart
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1 py-8 sm:py-10">
        <StorefrontBreadcrumbs className="pb-6" />
        <Suspense fallback={<StorefrontOutletFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
