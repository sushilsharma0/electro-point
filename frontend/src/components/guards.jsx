import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAdminAuth } from '@/hooks/useAuth';
import { AccountSkeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/layout/Container';

export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const loc = useLocation();
  if (isLoading) {
    return (
      <Container className="py-10">
        <AccountSkeleton />
      </Container>
    );
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { user, isLoading, isAdmin } = useAdminAuth();
  const loc = useLocation();
  if (!isLoading && (!user || !isAdmin)) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }
  return children;
}
