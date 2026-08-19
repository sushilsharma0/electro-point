import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CompareBar } from '@/components/product/CompareBar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { StorefrontOutletFallback } from '@/components/loading/RouteFallback';
import { StorefrontBreadcrumbs } from '@/components/layout/StorefrontBreadcrumbs';
import { MaintenanceModal } from '@/components/layout/MaintenanceModal';
import { useSettings } from '@/hooks/useCatalog';

export function StorefrontLayout() {
  const { settings } = useSettings();
  if (settings.maintenanceMode) return <MaintenanceModal />;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <main id="main" className="flex-1">
        <StorefrontBreadcrumbs />
        <Suspense fallback={<StorefrontOutletFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <CompareBar />
      <Footer />
    </div>
  );
}
