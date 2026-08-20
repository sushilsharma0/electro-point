import { Suspense, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Ticket,
  Users,
  FileText,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { WithTooltip } from '@/components/ui/tooltip';
import { useAdminAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { AdminSpinnerScreen } from '@/components/ui/spinner';
import { ChunkLoadingSignal } from '@/components/loading/ChunkLoadingSignal';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/pages', label: 'Pages', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children, user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-background">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo to="/admin/dashboard" />
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200',
                  isActive ? 'bg-muted-bg text-foreground' : 'text-muted hover:bg-muted-bg hover:text-foreground',
                )
              }
            >
              <WithTooltip label={label} side="right">
                <Icon className="h-4 w-4" />
              </WithTooltip>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3 text-xs text-muted">{user?.email || '\u00a0'}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <span className="font-display text-sm font-semibold lg:hidden">Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/" target="_blank" rel="noopener noreferrer">
                Storefront
              </a>
            </Button>
            <ThemeToggle />
            {onLogout ? (
              <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 lg:hidden" aria-label="Admin mobile">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs', isActive ? 'bg-muted-bg' : 'text-muted')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="main" className="mx-auto flex w-full max-w-admin flex-1 flex-col p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function isInitialAdminFetch(query) {
  const key = String(query.queryKey?.[0] || '');
  const isAdminQuery = key.startsWith('admin') || (key === 'auth' && query.queryKey?.[1] === 'admin');
  if (!isAdminQuery) return false;
  return query.state.data === undefined && query.state.fetchStatus === 'fetching';
}

export function AdminLayout() {
  const { logout, user, isLoading: authLoading } = useAdminAuth();
  const [chunkLoading, setChunkLoading] = useState(false);
  const pending = useIsFetching({ predicate: isInitialAdminFetch });
  const showSpinner = authLoading || chunkLoading || pending > 0;

  return (
    <AdminShell
      user={user}
      onLogout={() => logout.mutate(undefined, { onSuccess: () => window.location.assign('/admin/login') })}
    >
      <div className="relative flex min-h-[calc(100vh-7.5rem)] flex-1 flex-col">
        <Suspense fallback={<ChunkLoadingSignal onChange={setChunkLoading} />}>
          <Outlet />
        </Suspense>
        {showSpinner ? (
          <div className="absolute inset-0 z-10 bg-background">
            <AdminSpinnerScreen />
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}


