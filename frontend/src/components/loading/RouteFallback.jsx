import { useLocation } from 'react-router-dom';
import { AdminSpinnerPage, AdminSpinnerScreen } from '@/components/ui/spinner';
import { AdminShell } from '@/components/layout/AdminLayout';
import { StorefrontRouteSkeleton } from '@/components/ui/skeleton';

export function AppRouteFallback() {
  const { pathname } = useLocation();
  if (pathname === '/admin/login') {
    return <AdminSpinnerPage />;
  }
  if (pathname.startsWith('/admin')) {
    return (
      <AdminShell>
        <AdminSpinnerScreen />
      </AdminShell>
    );
  }
  return <StorefrontRouteSkeleton pathname={pathname} />;
}

export function StorefrontOutletFallback() {
  const { pathname } = useLocation();
  return <StorefrontRouteSkeleton pathname={pathname} />;
}
