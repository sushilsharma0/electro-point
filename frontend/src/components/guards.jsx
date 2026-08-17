import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAdminAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const loc = useLocation();
  if (isLoading) return <p className="p-8 text-sm text-muted">Checking session…</p>;
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { user, isLoading, isAdmin } = useAdminAuth();
  const loc = useLocation();
  if (isLoading) return <p className="p-8 text-sm text-muted">Checking session…</p>;
  if (!user || !isAdmin) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }
  return children;
}
