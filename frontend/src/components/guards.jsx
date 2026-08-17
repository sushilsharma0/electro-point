import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UnauthorizedPage, ForbiddenPage } from '@/pages/errors/ErrorPages';

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
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return <p className="p-8 text-sm text-muted">Checking session…</p>;
  if (!user) return <UnauthorizedPage />;
  if (!isAdmin) return <ForbiddenPage />;
  return children;
}
